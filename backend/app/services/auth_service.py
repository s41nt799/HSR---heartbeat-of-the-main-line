import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import DEFAULT_GROUP_ID
from ..core.security import hash_password, verify_password
from ..models.competency import Competency
from ..models.group import Group
from ..models.notification import Notification, NotificationTypes
from ..models.user import User
from ..models.user_competency_progress import UserCompetencyProgress
from ..schemas.auth import RegisterRequest


async def register(db: AsyncSession, data: RegisterRequest) -> User:
    user_db = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if user_db is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User with this email already exists')

    group_id = data.group_id if data.group_id else DEFAULT_GROUP_ID
    group = (await db.execute(select(Group).where(Group.id == group_id))).scalar_one_or_none()
    if group is None:
        if data.group_id is not None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Group not found')
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Default group not found, check seed data')

    hashed_password = hash_password(data.password)
    new_user = User(email=data.email, password_hash=hashed_password, display_name=data.display_name, group_id=group_id)
    db.add(new_user)
    await db.flush()

    competencies = (await db.execute(select(Competency))).scalars().all()
    for competency in competencies:
        progress = UserCompetencyProgress(user_id=new_user.id, competency_code=competency.code, score=0)
        db.add(progress)

    welcome_notification = Notification(user_id=new_user.id, type=NotificationTypes.NEW_SCENARIO, title='Добро пожаловать!', body='Вам доступны первые сценарии тренировок. Начните с «Конфликта пассажира».')
    db.add(welcome_notification)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    await db.refresh(new_user)
    return new_user

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user_db = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user_db is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Email or password is incorrect')
    if not verify_password(password, user_db.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Email or password is incorrect')
    return user_db
