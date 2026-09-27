import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.choice import Choice
from ..models.choice_competency import ChoiceCompetency
from ..models.competency import Competency
from ..models.play_session import PlaySession, PlaySessionStates
from ..models.scenario_node import ScenarioNode, ScenariosTypes
from ..models.session_event import SessionEvent, SessionEventTypes
from ..models.user_competency_progress import UserCompetencyProgress
from ..schemas.session import (
    ChoiceRequest,
    ChoiceResultResponse,
    CompetencyEffectItem,
    SessionResponse,
)
from .achievement_service import evaluate_achievements
from .notification_service import create_notification


def clamp(value: int, min_value: int, max_value: int) -> int:
    return max(min_value, min(value, max_value))


async def apply_choice(db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, data: ChoiceRequest) -> ChoiceResultResponse:
    session = (await db.execute(select(PlaySession).where(PlaySession.id == session_id).with_for_update())).scalar_one_or_none()

    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No access')
    if session.state != PlaySessionStates.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Session is not active')
    if session.version != data.version:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Version mismatch')

    if session.deadline and session.deadline < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_408_REQUEST_TIMEOUT, detail='Deadline expired')

    current_node = (await db.execute(select(ScenarioNode)
        .where(ScenarioNode.scenario_id == session.scenario_id,ScenarioNode.node_key == session.current_node_key))
    ).scalar_one_or_none()

    if current_node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Current node not found')

    choice = (await db.execute(select(Choice).where(Choice.node_id == current_node.id,Choice.choice_key == data.choice_key))
    ).scalar_one_or_none()

    if choice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Choice not found')
    if not choice.is_visible:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Choice not available')

    effects = choice.effects or {}
    loyalty_delta = effects.get('loyalty', 0)
    safety_delta = effects.get('safety', 0)
    score_delta = effects.get('points', effects.get('score', 0))

    session.loyalty = clamp(session.loyalty + loyalty_delta, 0, 100)
    session.safety = clamp(session.safety + safety_delta, 0, 100)
    session.score = max(0, session.score + score_delta)

    competency_rows = (await db.execute(select(ChoiceCompetency, Competency)
        .join(Competency, ChoiceCompetency.competency_code == Competency.code)
        .where(ChoiceCompetency.choice_id == choice.id))
    ).all()

    competency_effects = [
        CompetencyEffectItem(code=cc.competency_code, title=comp.title, delta=cc.delta)
        for cc, comp in competency_rows]

    for cc, comp in competency_rows:
        progress = (await db.execute(select(UserCompetencyProgress)
            .where(UserCompetencyProgress.user_id == session.user_id, UserCompetencyProgress.competency_code == cc.competency_code))
        ).scalar_one_or_none()
        if progress is None:
            progress = UserCompetencyProgress(user_id=session.user_id, competency_code=cc.competency_code, score=max(0, cc.delta))
            db.add(progress)
        else:
            progress.score = max(0, progress.score + cc.delta)
            progress.updated_at = datetime.now(timezone.utc)

    session_event = SessionEvent(
        session_id=session.id,
        node_key=session.current_node_key,
        choice_id=choice.id,
        choice_key=choice.choice_key,
        event_type=SessionEventTypes.CHOICE,
        effects=effects,
        competency_effects=[{'code': item.code, 'title': item.title, 'delta': item.delta}
            for item in competency_effects],
        loyalty_after=session.loyalty,
        safety_after=session.safety,
        score_delta=score_delta,
        timer_sec=current_node.timer_sec,
        timer_left_sec=(
            max(0, int((session.deadline - datetime.now(timezone.utc)).total_seconds()))
            if session.deadline else None),
    )
    db.add(session_event)

    session.current_node_key = choice.next_node_key
    session.version += 1
    session.updated_at = datetime.now(timezone.utc)
    session.deadline = None

    next_node = (await db.execute(select(ScenarioNode)
        .where(ScenarioNode.scenario_id == session.scenario_id, ScenarioNode.node_key == choice.next_node_key))
    ).scalar_one_or_none()

    if next_node is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Next node not found')

    finished = next_node.type in (ScenariosTypes.ENDING_SUCCESS, ScenariosTypes.ENDING_FAIL)
    new_state = session.state.value

    if finished:
        session.state = (PlaySessionStates.COMPLETED if next_node.type == ScenariosTypes.ENDING_SUCCESS else PlaySessionStates.FAILED)
        session.finished_at = datetime.now(timezone.utc)
        session.updated_at = datetime.now(timezone.utc)
        session.deadline = None
        new_state = session.state.value

        finish_event = SessionEvent(
            session_id=session.id,
            event_type=SessionEventTypes.FINISH,
            node_key=session.current_node_key,
            choice_id=None,
            choice_key=None,
            effects={},
            competency_effects=[],
            loyalty_after=session.loyalty,
            safety_after=session.safety,
            score_delta=0,
            timer_sec=None,
            timer_left_sec=None,
        )
        db.add(finish_event)

        new_achievements = await evaluate_achievements(db, user_id, session)
        for achievement in new_achievements:
            await create_notification(
                db,
                user_id,
                notification_type='achievement',
                title=f'Новая ачивка: {achievement.title}',
                body=achievement.description,
            )

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    await db.refresh(session)

    return ChoiceResultResponse(
        session_id=session.id,
        new_node_key=session.current_node_key,
        loyalty_delta=loyalty_delta,
        safety_delta=safety_delta,
        score_delta=score_delta,
        competency_effects=competency_effects,
        new_state=new_state,
        finished=finished,
    )


TIMEOUT_LOYALTY_DELTA = -5
TIMEOUT_SAFETY_DELTA = -10


async def apply_timeout(db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID) -> ChoiceResultResponse:
    session = (await db.execute(select(PlaySession).where(PlaySession.id == session_id).with_for_update())).scalar_one_or_none()

    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No access')
    if session.state != PlaySessionStates.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Session is not active')

    if session.deadline is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='No timer set for this session')

    if session.deadline > datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Timer has not expired yet')

    current_node = (await db.execute(select(ScenarioNode)
        .where(ScenarioNode.scenario_id == session.scenario_id, ScenarioNode.node_key == session.current_node_key))
    ).scalar_one_or_none()

    if current_node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Current node not found')

    timeout_choice = (await db.execute(select(Choice).where(Choice.node_id == current_node.id, Choice.choice_key == 'timeout'))).scalar_one_or_none()

    if timeout_choice is not None:
        te = timeout_choice.effects or {}
        loyalty_delta = te.get('loyalty', TIMEOUT_LOYALTY_DELTA)
        safety_delta = te.get('safety', TIMEOUT_SAFETY_DELTA)
        score_delta = te.get('points', 0)
    else:
        loyalty_delta = TIMEOUT_LOYALTY_DELTA
        safety_delta = TIMEOUT_SAFETY_DELTA
        score_delta = 0

    session.loyalty = clamp(session.loyalty + loyalty_delta, 0, 100)
    session.safety = clamp(session.safety + safety_delta, 0, 100)
    session.score = max(0, session.score + score_delta)

    timer_left_sec = 0

    session_event = SessionEvent(
        session_id=session.id,
        event_type=SessionEventTypes.TIMEOUT,
        node_key=session.current_node_key,
        choice_id=None,
        choice_key=None,
        effects={'loyalty': loyalty_delta, 'safety': safety_delta, 'points': score_delta},
        competency_effects=[],
        loyalty_after=session.loyalty,
        safety_after=session.safety,
        score_delta=score_delta,
        timer_sec=current_node.timer_sec,
        timer_left_sec=timer_left_sec,
    )
    db.add(session_event)

    if timeout_choice is not None:
        next_node_key = timeout_choice.next_node_key
    else:
        session.state = PlaySessionStates.FAILED
        session.finished_at = datetime.now(timezone.utc)
        session.current_node_key = current_node.node_key
        session.version += 1
        session.updated_at = datetime.now(timezone.utc)
        session.deadline = None

        finish_event = SessionEvent(
            session_id=session.id,
            event_type=SessionEventTypes.FAIL,
            node_key=session.current_node_key,
            choice_id=None,
            choice_key=None,
            effects={},
            competency_effects=[],
            loyalty_after=session.loyalty,
            safety_after=session.safety,
            score_delta=0,
            timer_sec=None,
            timer_left_sec=None,
        )
        db.add(finish_event)

        # TODO: вызвать вспомогательные сервисы

        try:
            await db.commit()
        except Exception:
            await db.rollback()
            raise

        await db.refresh(session)

        return ChoiceResultResponse(
            session_id=session.id,
            new_node_key=session.current_node_key,
            loyalty_delta=loyalty_delta,
            safety_delta=safety_delta,
            score_delta=score_delta,
            competency_effects=[],
            new_state=session.state.value,
            finished=True,
        )

    session.current_node_key = next_node_key
    session.version += 1
    session.updated_at = datetime.now(timezone.utc)
    session.deadline = None

    next_node = (await db.execute(select(ScenarioNode)
        .where(ScenarioNode.scenario_id == session.scenario_id, ScenarioNode.node_key == next_node_key))
    ).scalar_one_or_none()

    if next_node is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Next node not found')

    finished = next_node.type in (ScenariosTypes.ENDING_SUCCESS, ScenariosTypes.ENDING_FAIL)
    new_state = session.state.value


    if finished:
        session.state = (PlaySessionStates.COMPLETED if next_node.type == ScenariosTypes.ENDING_SUCCESS else PlaySessionStates.FAILED)
        session.finished_at = datetime.now(timezone.utc)
        session.updated_at = datetime.now(timezone.utc)
        session.deadline = None
        new_state = session.state.value

        finish_event = SessionEvent(
            session_id=session.id,
            event_type=SessionEventTypes.FINISH,
            node_key=session.current_node_key,
            choice_id=None,
            choice_key=None,
            effects={},
            competency_effects=[],
            loyalty_after=session.loyalty,
            safety_after=session.safety,
            score_delta=0,
            timer_sec=None,
            timer_left_sec=None,
        )
        db.add(finish_event)

        # TODO: вызвать вспомогательные сервисы

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    await db.refresh(session)

    return ChoiceResultResponse(
        session_id=session.id,
        new_node_key=session.current_node_key,
        loyalty_delta=loyalty_delta,
        safety_delta=safety_delta,
        score_delta=score_delta,
        competency_effects=[],
        new_state=new_state,
        finished=finished,
    )


async def finish_session(db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, reason: PlaySessionStates) -> SessionResponse:
    session = (await db.execute(select(PlaySession).where(PlaySession.id == session_id).with_for_update())).scalar_one_or_none()

    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No access')
    if session.state != PlaySessionStates.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Session is not active')

    if reason == PlaySessionStates.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot finish session as active')

    session.finished_at = datetime.now(timezone.utc)
    session.state = reason
    session.deadline = None
    session.updated_at = datetime.now(timezone.utc)

    if reason == PlaySessionStates.COMPLETED:
        event_type = SessionEventTypes.FINISH
    elif reason == PlaySessionStates.FAILED:
        event_type = SessionEventTypes.FAIL
    else:
        event_type = SessionEventTypes.ABANDON

    session_event = SessionEvent(
        session_id=session.id,
        event_type=event_type,
        node_key=session.current_node_key,
        choice_id=None,
        choice_key=None,
        effects={},
        competency_effects=[],
        loyalty_after=session.loyalty,
        safety_after=session.safety,
        score_delta=0,
        timer_sec=None,
        timer_left_sec=None,
    )
    db.add(session_event)

    # TODO: вызвать вспомогательные сервисы в той же транзакции
    # if reason == PlaySessionStates.COMPLETED:
    #     await achievement_evaluator.evaluate(db, session_id, user_id)
    #     await level_service.add_xp(db, user_id, session.score)
    #     await notification_service.create_achievements(db, user_id)
    # await leaderboard_service.update(db, user_id)

    session.version += 1

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    await db.refresh(session)

    return SessionResponse(
        session_id=session.id,
        scenario_id=session.scenario_id,
        current_node_key=session.current_node_key,
        state=session.state.value,
        loyalty=session.loyalty,
        safety=session.safety,
        score=session.score,
        deadline=session.deadline,
        started_at=session.started_at,
        is_restarted=False
    )
