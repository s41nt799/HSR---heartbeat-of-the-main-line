from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.base import get_db
from ...models.user import User
from ...schemas.profile import ProfileResponse, SessionHistoryResponse
from ...services.profile_service import get_user_profile, get_user_sessions_history
from ..deps import get_current_user

profile_router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])


@profile_router.get("/me", status_code=status.HTTP_200_OK, response_model=ProfileResponse,
    summary="Профиль пользователя", description="Возвращает полный профиль пользователя: данные аккаунта, группу, статистику прохождений и топ компетенций",
    responses={401: {"description": "Токен отсутствует или невалиден"}})
async def read_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_profile(db, current_user.id)


@profile_router.get("/me/sessions", status_code=status.HTTP_200_OK, response_model=SessionHistoryResponse,
    summary="История сессий", description="Возвращает историю сессий пользователя с пагинацией",
    responses={
        401: {"description": "Токен отсутствует или невалиден"},
        422: {"description": "Некорректные параметры пагинации"},
    },
)
async def read_sessions(
    limit: int = Query(default=20, ge=1, le=100, description="Количество элементов на странице"),
    offset: int = Query(default=0, ge=0, description="Смещение от начала"),
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await get_user_sessions_history(db, current_user.id, limit, offset)
