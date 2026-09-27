import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.competency import Competency
from ..models.play_session import PlaySession, PlaySessionStates
from ..models.scenario import Scenario
from ..models.scenario_competency import ScenarioCompetency
from ..models.session_event import SessionEvent, SessionEventTypes
from ..models.user_competency_progress import UserCompetencyProgress
from ..schemas.analytics import (
    AnalyticsResponse,
    CompetencyEffectHistoryItem,
    CompetencyProgressItem,
    HistoryResponse,
    ProgressHistoryItem,
    WeakAnalyticsResponse,
    WeakCompetencyItem,
)

MAX_SCORE = 100

def get_level(progress_percent: int) -> str:
    if progress_percent < 25:
        return 'начальный'
    elif progress_percent < 50:
        return 'средний'
    elif progress_percent < 75:
        return 'продвинутый'
    else:
        return 'эксперт'

RECOMMENDATIONS = {
    'communication': 'Рекомендуется практиковать сценарии с диалогами для улучшения навыков коммуникации',
    'safety': 'Обратите внимание на протоколы безопасности при прохождении сценариев',
    'service': 'Фокусируйтесь на качестве обслуживания и обратной связи пассажирам',
    'emergency': 'Пройдите сценарии с нештатными ситуациями для отработки действий в ЧС',
    'conflict_resolution': 'Практикуйте разрешение конфликтов в сценариях с агрессивными пассажирами',
    'teamwork': 'Обратите внимание на взаимодействие с коллегами в сценариях',
}
DEFAULT_RECOMMENDATION = 'Рекомендуется повторить сценарии для улучшения этой компетенции'

async def get_user_progress(db: AsyncSession, user_id: uuid.UUID) -> AnalyticsResponse:
    competencies = (await db.execute(select(Competency))).scalars().all()

    user_progress = (await db.execute(select(UserCompetencyProgress).where(UserCompetencyProgress.user_id == user_id))).scalars().all()

    progress_map = {p.competency_code: p.score for p in user_progress}

    items = []
    total_score = 0

    for comp in competencies:
        score = progress_map.get(comp.code, 0)
        progress_percent = min(int(score / MAX_SCORE * 100), 100)
        level = get_level(progress_percent)

        items.append(
            CompetencyProgressItem(
                code=comp.code,
                title=comp.title,
                description=comp.description,
                score=score,
                max_score=MAX_SCORE,
                progress_percent=progress_percent,
                level=level,
            )
        )
        total_score += score

    competencies_count = len(competencies)
    average_progress_percent = (int(total_score / (competencies_count * MAX_SCORE) * 100) if competencies_count > 0 else 0)

    return AnalyticsResponse(
        total_score=total_score,
        competencies_count=competencies_count,
        average_progress_percent=average_progress_percent,
        items=items,
    )


async def get_weak_competencies(db: AsyncSession, user_id: uuid.UUID) -> WeakAnalyticsResponse:
    progress = await get_user_progress(db, user_id)

    weak_items = [item for item in progress.items if item.progress_percent < 50]

    weak_items.sort(key=lambda x: x.progress_percent)

    result_items = []

    for item in weak_items:
        recommendation = RECOMMENDATIONS.get(item.code, DEFAULT_RECOMMENDATION)

        scenario_row = (await db.execute(select(ScenarioCompetency.scenario_id)
                .where(ScenarioCompetency.competency_code == item.code)
                .limit(1))
        ).scalar_one_or_none()

        suggested_scenario_id = None
        if scenario_row is not None:
            active_scenario = (await db.execute(select(Scenario.id)
                    .where(Scenario.id == scenario_row, Scenario.is_active.is_(True)))
            ).scalar_one_or_none()
            if active_scenario is not None:
                suggested_scenario_id = active_scenario

        result_items.append(
            WeakCompetencyItem(
                code=item.code,
                title=item.title,
                score=item.score,
                progress_percent=item.progress_percent,
                recommendation=recommendation,
                suggested_scenario_id=suggested_scenario_id,
            )
        )

    return WeakAnalyticsResponse(
        weak_count=len(result_items),
        items=result_items,
    )


async def get_progress_history(db: AsyncSession, user_id: uuid.UUID) -> HistoryResponse:
    sessions = (await db.execute(select(PlaySession).where(PlaySession.user_id == user_id,
                PlaySession.state.in_([
                    PlaySessionStates.COMPLETED,
                    PlaySessionStates.FAILED,
                    PlaySessionStates.EXPIRED,
                    PlaySessionStates.ABANDONED,
                ]),
            )
            .order_by(PlaySession.finished_at.desc())
            .limit(20))
    ).scalars().all()

    if not sessions:
        return HistoryResponse(items=[], total=0)

    items = []

    for session in sessions:
        session_events = (await db.execute(select(SessionEvent).where(SessionEvent.session_id == session.id, SessionEvent.event_type == SessionEventTypes.CHOICE))).scalars().all()

        effects_map = defaultdict(lambda: {'title': '', 'delta': 0})

        for event in session_events:
            if event.competency_effects:
                for effect in event.competency_effects:
                    code = effect.get('code')
                    if code:
                        effects_map[code]['title'] = effect.get('title', '')
                        effects_map[code]['delta'] += effect.get('delta', 0)

        competency_effects = [
            CompetencyEffectHistoryItem(code=code, title=data['title'], delta=data['delta'])
            for code, data in effects_map.items()]

        items.append(
            ProgressHistoryItem(
                session_id=session.id,
                scenario_id=session.scenario_id,
                finished_at=session.finished_at,
                competency_effects=competency_effects,
                score_delta=session.score,
            )
        )

    return HistoryResponse(items=items, total=len(items))
