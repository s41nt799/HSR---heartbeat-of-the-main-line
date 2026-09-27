import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.base import get_db
from ...models.user import User
from ...schemas.notifications import NotificationItem, NotificationResponse
from ...services.notification_service import (
    get_user_notifications,
    mark_notification_read,
)
from ..deps import get_current_user

notifications_router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])  # ← добавить /


@notifications_router.get("/", status_code=status.HTTP_200_OK, response_model=NotificationResponse,
    summary="Список уведомлений", description="Возвращает список уведомлений пользователя с пагинацией",
    responses={
        401: {"description": "Токен отсутствует или невалиден"},
        422: {"description": "Некорректные параметры пагинации"},
    },
)
async def get_notifications(limit: int = Query(default=10, ge=1, le=100, description="Количество элементов на странице"), offset: int = Query(default=0, ge=0, description="Смещение от начала"),
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_notifications(db, current_user.id, limit, offset)


@notifications_router.patch("/{notification_id}/read", status_code=status.HTTP_200_OK, response_model=NotificationItem,
    summary="Пометить уведомление прочитанным", description="Устанавливает время прочтения для уведомления",
    responses={
        404: {"description": "Уведомление не найдено"},
        403: {"description": "Нет доступа к уведомлению"},
        401: {"description": "Токен отсутствует или невалиден"},
    },
)
async def mark_notification_as_read(notification_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await mark_notification_read(db, notification_id, current_user.id)
