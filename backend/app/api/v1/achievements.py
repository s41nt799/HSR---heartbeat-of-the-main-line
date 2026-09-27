from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.base import get_db
from ...models.user import User
from ...schemas.achievement import AchievementsResponse, UserAchievementsResponse
from ...services.achievement_service import (
    get_achievements_progress,
    get_user_achievements,
)
from ..deps import get_current_user

achievement_router = APIRouter(prefix="/api/v1/achievements", tags=["Achievements"])


@achievement_router.get("/", status_code=status.HTTP_200_OK, response_model=AchievementsResponse,
    summary="Все ачивки с прогрессом", description="Возвращает справочник ачивок с прогрессом получения для текущего пользователя",
    responses={401: {"description": "Токен отсутствует или невалиден"}},
)
async def get_achievements(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_achievements_progress(db, current_user.id)


@achievement_router.get("/me", status_code=status.HTTP_200_OK, response_model=UserAchievementsResponse,
    summary="Полученные ачивки", description="Возвращает только полученные ачивки текущего пользователя с датой получения",
    responses={401: {"description": "Токен отсутствует или невалиден"}},
)
async def get_my_achievements(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_achievements(db, current_user.id)
