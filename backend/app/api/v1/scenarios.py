from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.base import get_db
from ...models.user import User
from ...schemas.scenario import ScenarioDetailResponse, ScenarioListResponse
from ...services.scenario_service import get_active_scenarios, get_scenario_detail
from ..deps import get_current_user

scenarios_router = APIRouter(prefix='/api/v1/scenarios', tags=['Scenarios'])

@scenarios_router.get('', status_code=status.HTTP_200_OK, response_model=ScenarioListResponse,
    summary='Список активных сценариев', description='Возвращает все активные сценарии с краткой информацией и лучшим счётом текущего пользователя',
    responses={
            401: {'description': 'Токен отсутствует или невалиден'},
        })
async def get_scenarios(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):  # noqa: B008
    scenarios = await get_active_scenarios(db, current_user.id)
    return scenarios


@scenarios_router.get('/{scenario_id}', status_code=status.HTTP_200_OK, response_model=ScenarioDetailResponse,
    summary='Карточка сценария', description='Детальная информация о сценарии: описание, компетенции, статистика пользователя',
    responses={
            404: {'description': 'Сценарий не найден или не активен'},
            401: {'description': 'Токен отсутствует или невалиден'},
        })
async def get_scenario_by_scenario_id(scenario_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):  # noqa: B008
    detail = await get_scenario_detail(db, scenario_id, current_user.id)
    return detail
