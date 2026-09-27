import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.achievement import Achievement
from ..models.choice import Choice
from ..models.play_session import PlaySession, PlaySessionStates
from ..models.scenario import Scenario
from ..models.scenario_node import ScenarioNode
from ..models.session_event import SessionEvent
from ..models.user_achievement import UserAchievement
from ..schemas.session import (
    AchievementItem,
    ChoiceItem,
    CompetencyProgressItem,
    NodeResponse,
    SessionDebriefResponse,
    SessionEventItem,
    SessionResponse,
    SessionStartRequest,
)


async def start_session(db: AsyncSession, user_id: uuid.UUID, data: SessionStartRequest) -> tuple[SessionResponse, bool]:
    scenario = (await db.execute(select(Scenario)
        .where(Scenario.id == data.scenario_id, Scenario.is_active.is_(True)))
    ).scalar_one_or_none()

    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Scenario not found')

    existing_session = (await db.execute(select(PlaySession)
        .where(PlaySession.user_id == user_id, PlaySession.scenario_id == data.scenario_id, PlaySession.state == PlaySessionStates.ACTIVE))
    ).scalar_one_or_none()
    if existing_session is not None:
        response = SessionResponse(
            session_id=existing_session.id,
            scenario_id=existing_session.scenario_id,
            current_node_key=existing_session.current_node_key,
            state=existing_session.state.value,
            loyalty=existing_session.loyalty,
            safety=existing_session.safety,
            score=existing_session.score,
            deadline=existing_session.deadline,
            started_at=existing_session.started_at,
            is_restarted=True,
        )
        return response, True
    start_node = (await db.execute(select(ScenarioNode)
        .where(ScenarioNode.scenario_id == scenario.id, ScenarioNode.is_start.is_(True)))
    ).scalar_one_or_none()
    if start_node is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Start node not found for scenario')
    new_session = PlaySession(user_id=user_id, scenario_id=scenario.id, current_node_key=start_node.node_key)
    db.add(new_session)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    await db.refresh(new_session)
    response = SessionResponse(
        session_id=new_session.id,
        scenario_id=new_session.scenario_id,
        current_node_key=new_session.current_node_key,
        state=new_session.state.value,
        loyalty=new_session.loyalty,
        safety=new_session.safety,
        score=new_session.score,
        deadline=new_session.deadline,
        started_at=new_session.started_at,
        is_restarted=False,
    )
    return response, False


async def get_session_debrief(db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID) -> SessionDebriefResponse:
    session = (await db.execute(select(PlaySession).where(PlaySession.id == session_id))).scalar_one_or_none()

    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No access')
    if session.state == PlaySessionStates.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Session is active')

    events = (await db.execute(select(SessionEvent).where(SessionEvent.session_id == session_id))).scalars().all()

    if session.finished_at and session.started_at:
        duration_sec = int((session.finished_at - session.started_at).total_seconds())
    else:
        duration_sec = 0

    event_items = [SessionEventItem(
        event_type=e.event_type.value if hasattr(e.event_type, 'value') else str(e.event_type),
        node_key=e.node_key,
        choice_key=e.choice_key,
        loyalty_after=e.loyalty_after,
        safety_after=e.safety_after,
        score_delta=e.score_delta,
        created_at=e.created_at,
    ) for e in events]

    competency_deltas = defaultdict(lambda: {'title': '', 'delta': 0})

    for event in events:
        if event.competency_effects:
            for effect in event.competency_effects:
                code = effect.get('code')
                if code:
                    competency_deltas[code]['title'] = effect.get('title', '')
                    competency_deltas[code]['delta'] += effect.get('delta', 0)

    competency_progress = [
        CompetencyProgressItem(
            code=code,
            title=data['title'],
            delta=data['delta'],
            total_score=data['delta'],
        )
        for code, data in competency_deltas.items()
    ]

    achievements_rows = (await db.execute(select(Achievement)
        .join(UserAchievement, Achievement.code == UserAchievement.achievement_code)
        .where(UserAchievement.user_id == user_id, UserAchievement.session_id == session_id))
    ).scalars().all()

    achievements_unlocked = [
        AchievementItem(
            code=a.code,
            title=a.title,
            description=a.description,
            icon=a.icon,
        )
        for a in achievements_rows
    ]

    recommendations = []
    for cp in competency_progress:
        if cp.delta <= 0:
            recommendations.append(f'Рекомендуется повторить сценарий для улучшения компетенции «{cp.title}»')

    if session.state == PlaySessionStates.FAILED:
        recommendations.append('Сценарий не завершён успешно. Попробуйте ещё раз, обращая внимание на безопасность')

    return SessionDebriefResponse(
            session_id=session.id,
            scenario_id=session.scenario_id,
            state=session.state.value if hasattr(session.state, 'value') else str(session.state),
            final_score=session.score,
            loyalty=session.loyalty,
            safety=session.safety,
            duration_sec=duration_sec,
            events=event_items,
            competency_progress=competency_progress,
            achievements_unlocked=achievements_unlocked,
            recommendations=recommendations
        )


async def get_current_node(db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID) -> NodeResponse:
    session = (await db.execute(select(PlaySession).where(PlaySession.id == session_id))).scalar_one_or_none()

    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No access')
    if session.state != PlaySessionStates.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Session is not active')

    current_node = (await db.execute(select(ScenarioNode).where(ScenarioNode.scenario_id == session.scenario_id, ScenarioNode.node_key == session.current_node_key))).scalar_one_or_none()

    if current_node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Current node not found')

    choices = (await db.execute(select(Choice)
            .where(Choice.node_id == current_node.id, Choice.is_visible.is_(True))
            .order_by(Choice.sort_order))
    ).scalars().all()

    timer_left_sec = None
    if session.deadline is not None:
        timer_left_sec = max(0, int((session.deadline - datetime.now(timezone.utc)).total_seconds()))

    return NodeResponse(
        node_key=current_node.node_key,
        type=current_node.type.value,
        text=current_node.node_text,
        timer_sec=current_node.timer_sec,
        timer_left_sec=timer_left_sec,
        choices=[
            ChoiceItem(choice_key=c.choice_key, choice_text=c.choice_text, recommendation=c.recommendation, is_visible=c.is_visible)
            for c in choices
        ],
    )


async def get_active_sessions(db: AsyncSession, user_id: uuid.UUID, scenario_id: str | None = None) -> list[SessionResponse]:
    query = select(PlaySession).where(PlaySession.user_id == user_id, PlaySession.state == PlaySessionStates.ACTIVE)

    if scenario_id is not None:
        query = query.where(PlaySession.scenario_id == scenario_id)

    sessions = (await db.execute(query)).scalars().all()

    return [
        SessionResponse(
            session_id=s.id,
            scenario_id=s.scenario_id,
            current_node_key=s.current_node_key,
            state=s.state.value,
            loyalty=s.loyalty,
            safety=s.safety,
            score=s.score,
            deadline=s.deadline,
            started_at=s.started_at,
            is_restarted=False)
        for s in sessions]
