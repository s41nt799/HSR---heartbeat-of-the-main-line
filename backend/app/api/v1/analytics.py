from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.user import User
from ...schemas.analytics import (
    AnalyticsResponse,
    HistoryResponse,
    WeakAnalyticsResponse,
)
from ...services.analytics_service import (
    get_progress_history,
    get_user_progress,
    get_weak_competencies,
)
from ..deps import get_current_user, get_db

analytics_router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@analytics_router.get("/me", status_code=status.HTTP_200_OK, response_model=AnalyticsResponse,
    summary="Общий прогресс по компетенциям", description="Возвращает прогресс пользователя по всем компетенциям с уровнями развития",
    responses={401: {"description": "Токен отсутствует или невалиден"}})
async def get_analytics(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_progress(db, current_user.id)


@analytics_router.get("/weak", status_code=status.HTTP_200_OK, response_model=WeakAnalyticsResponse,
    summary="Слабые зоны с рекомендациями", description="Возвращает компетенции с прогрессом ниже 50% и рекомендации по улучшению",
    responses={401: {"description": "Токен отсутствует или невалиден"}})
async def get_weak_analytics(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_weak_competencies(db, current_user.id)


@analytics_router.get("/history", status_code=status.HTTP_200_OK, response_model=HistoryResponse,
    summary="История прогресса по сессиям", description="Возвращает изменения компетенций по последним 20 завершённым сессиям",
    responses={401: {"description": "Токен отсутствует или невалиден"}})
async def get_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),):
    return await get_progress_history(db, current_user.id)
