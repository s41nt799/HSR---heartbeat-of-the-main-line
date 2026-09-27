import uuid
from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.choice import Choice
from ..models.competency import Competency
from ..models.play_session import PlaySession, PlaySessionStates
from ..models.scenario import Scenario
from ..models.scenario_competency import ScenarioCompetency
from ..models.scenario_node import ScenarioNode
from ..schemas.scenario import (
    ScenarioCompetencyItem,
    ScenarioDetailResponse,
    ScenarioListItem,
    ScenarioListResponse,
)


async def get_active_scenarios(db: AsyncSession, user_id: uuid.UUID) -> ScenarioListResponse:
    scenarios = (await db.execute(select(Scenario).where(Scenario.is_active.is_(True)))).scalars().all()
    if not scenarios:
        return ScenarioListResponse(items=[], total=0)

    scenario_ids = [s.id for s in scenarios]
    competencies_rows = (await db.execute(select(ScenarioCompetency).where(ScenarioCompetency.scenario_id.in_(scenario_ids)))).scalars().all()
    competencies_map = defaultdict(list)

    for row in competencies_rows:
        competencies_map[row.scenario_id].append(row.competency_code)

    best_scores_rows = (await db.execute(select(PlaySession.scenario_id, func.max(PlaySession.score))
            .where(PlaySession.user_id == user_id,
                PlaySession.state.in_([PlaySessionStates.COMPLETED,PlaySessionStates.FAILED]),
            ).group_by(PlaySession.scenario_id))
    ).all()
    best_scores_map = {row[0]: row[1] for row in best_scores_rows}

    items = [
        ScenarioListItem(id=s.id, title=s.title, description=s.description, difficulty=s.difficulty,
            competencies=competencies_map.get(s.id, []),
            best_score=best_scores_map.get(s.id))
        for s in scenarios
    ]
    return ScenarioListResponse(items=items, total=len(items))


async def get_scenario_detail(db: AsyncSession, scenario_id: str, user_id: uuid.UUID) -> ScenarioDetailResponse:
    scenario = (await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    ).scalar_one_or_none()

    if scenario is None or not scenario.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Scenario not found')

    competency_rows = (await db.execute(select(ScenarioCompetency, Competency)
            .join(Competency, ScenarioCompetency.competency_code == Competency.code)
            .where(ScenarioCompetency.scenario_id == scenario_id))
    ).all()

    competencies = [
        ScenarioCompetencyItem(code=sc.competency_code,title=comp.title,weight=sc.weight)
        for sc, comp in competency_rows
    ]

    nodes_count = (await db.execute(select(func.count(ScenarioNode.id))
        .where(ScenarioNode.scenario_id == scenario_id))
    ).scalar_one()

    choices_count = (await db.execute(select(func.count(Choice.id))
        .join(ScenarioNode, Choice.node_id == ScenarioNode.id)
        .where(ScenarioNode.scenario_id == scenario_id))
    ).scalar_one()

    best_score = (await db.execute(select(func.max(PlaySession.score))
            .where(PlaySession.scenario_id == scenario_id,
                PlaySession.user_id == user_id,
                PlaySession.state.in_([PlaySessionStates.COMPLETED, PlaySessionStates.FAILED])))
    ).scalar_one_or_none()

    sessions_completed = (await db.execute(select(func.count(PlaySession.id))
            .where(PlaySession.scenario_id == scenario_id, PlaySession.user_id == user_id, PlaySession.state == PlaySessionStates.COMPLETED))
    ).scalar_one()

    return ScenarioDetailResponse(
        id=scenario.id,
        title=scenario.title,
        description=scenario.description,
        difficulty=scenario.difficulty,
        version=scenario.version,
        competencies=competencies,
        nodes_count=nodes_count,
        choices_count=choices_count,
        best_score=best_score,
        sessions_completed=sessions_completed,
    )
