import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.notification import Notification
from ..schemas.notifications import NotificationItem, NotificationResponse


async def get_user_notifications(db: AsyncSession, user_id: uuid.UUID, limit: int, offset: int) -> NotificationResponse:
    notifications = (await db.execute(select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(limit))
    ).scalars().all()

    total_count = (await db.execute(select(func.count()).where(Notification.user_id == user_id))).scalar_one()

    unread_count = (await db.execute(select(func.count()).where(Notification.user_id == user_id, Notification.read_at.is_(None)))).scalar_one()

    items = [
        NotificationItem(
            id=n.id,
            type=n.type.value if hasattr(n.type, 'value') else str(n.type),
            title=n.title,
            body=n.body,
            read_at=n.read_at,
            is_read=n.read_at is not None,
            created_at=n.created_at,
        )
        for n in notifications
    ]

    return NotificationResponse(total=total_count, unread_count=unread_count, items=items)


async def mark_notification_read(db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> NotificationItem:
    notification = (await db.execute(select(Notification).where(Notification.id == notification_id))).scalar_one_or_none()

    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')
    if notification.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No access')

    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    await db.refresh(notification)

    return NotificationItem(
        id=notification.id,
        type=notification.type.value if hasattr(notification.type, 'value') else str(notification.type),
        title=notification.title,
        body=notification.body,
        read_at=notification.read_at,
        is_read=notification.read_at is not None,
        created_at=notification.created_at,
    )


async def create_notification(db: AsyncSession, user_id: uuid.UUID, notification_type: str, title: str, body: str) -> Notification:
    notification = Notification(user_id=user_id, type=notification_type, title=title, body=body)
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    return notification
