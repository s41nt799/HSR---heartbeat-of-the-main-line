from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.base import get_db
from ...models.user import User
from ...schemas.leaderboard import LeaderboardResponse
from ...services.leaderboard_service import get_leaderboard
from ..deps import get_current_user

leaderboard_router = APIRouter(prefix="/api/v1/leaderboard", tags=["leaderboard"])  # ← добавить /


@leaderboard_router.get("/", status_code=status.HTTP_200_OK, response_model=LeaderboardResponse,
    summary="Лидерборд по общему счёту", description="Возвращает топ пользователей по общему счёту с позицией текущего пользователя",
    responses={
        401: {"description": "Токен отсутствует или невалиден"},
        422: {"description": "Некорректный параметр limit"},
    },
)
async def read_leaderboard(
    limit: int = Query(default=10, ge=1, le=100, description="Количество пользователей в топе"),
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
    return await get_leaderboard(db, current_user.id, limit)
