
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.base import get_db
from ...models.play_session import PlaySessionStates
from ...models.user import User
from ...schemas.session import (
    ChoiceRequest,
    ChoiceResultResponse,
    NodeResponse,
    SessionDebriefResponse,
    SessionResponse,
    SessionStartRequest,
)
from ...services.action_resolver import apply_choice, apply_timeout, finish_session
from ...services.session_service import (
    get_active_sessions,
    get_current_node,
    get_session_debrief,
    start_session,
)
from ..deps import get_current_user

session_router = APIRouter(prefix='/api/v1/sessions', tags=['Sessions'])


@session_router.post('/start', response_model=SessionResponse,
    summary='Старт сессии', description='Создаёт новую сессию или возвращает существующую активную',
    responses={
        201: {'description': 'Создана новая сессия'},
        200: {'description': 'Возвращена существующая активная сессия'},
        404: {'description': 'Сценарий не найден или не активен'},
        401: {'description': 'Токен отсутствует или невалиден'},
    })
async def post_start_session(data: SessionStartRequest, response: Response, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_response, is_new = await start_session(db, current_user.id, data)
    response.status_code = status.HTTP_201_CREATED if is_new else status.HTTP_200_OK
    return session_response


@session_router.get('/active', response_model=list[SessionResponse],
    summary='Список активных сессий', description='Возвращает активные сессии пользователя, опционально фильтрует по сценарию',
    responses={401: {'description': 'Токен отсутствует или невалиден'}})
async def get_active_sessions_list(
    scenario_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_active_sessions(db, current_user.id, scenario_id)


@session_router.get('/{session_id}/node',status_code=status.HTTP_200_OK, response_model=NodeResponse,
    summary='Текущий узел сессии', description='Возвращает текущий узел с текстом, выборами и таймером',
    responses={
        404: {'description': 'Сессия не найдена'},
        403: {'description': 'Нет доступа к сессии'},
        409: {'description': 'Сессия не активна'},
        401: {'description': 'Токен отсутствует или невалиден'},
    })
async def get_node(session_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_current_node(db, session_id, current_user.id)


@session_router.post('/{session_id}/choice', status_code=status.HTTP_200_OK, response_model=ChoiceResultResponse,
    summary='Применить выбор', description='Применяет выбор пользователя к активной сессии. Требует version для идемпотентности')
async def post_choice(session_id: uuid.UUID, data: ChoiceRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await apply_choice(db, session_id, current_user.id, data)
    return result


@session_router.post('/{session_id}/timeout', status_code=status.HTTP_200_OK, response_model=ChoiceResultResponse,
    summary='Зафиксировать таймаут', description='Применяет штрафы за истёкший таймер и переходит дальше или завершает сессию')
async def post_timeout(session_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await apply_timeout(db, session_id, current_user.id)
    return result


@session_router.post('/{session_id}/finish', status_code=status.HTTP_200_OK, response_model=SessionResponse,
    summary='Завершить сессию', description='')
async def post_finish(session_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await finish_session(db, session_id, current_user.id, PlaySessionStates.ABANDONED)
    return result


@session_router.get('/{session_id}', status_code=status.HTTP_200_OK, response_model=SessionDebriefResponse,
    summary='Дебриф сессии', description='Детальная информация о завершённой сессии: история событий, прогресс компетенций, ачивки')
async def get_session(session_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await get_session_debrief(db, session_id, current_user.id)
    return result
