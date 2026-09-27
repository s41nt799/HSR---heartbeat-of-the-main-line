import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.competency import Competency
from ..models.group import Group
from ..models.play_session import PlaySession, PlaySessionStates
from ..models.user import User
from ..models.user_competency_progress import UserCompetencyProgress
from ..schemas.profile import (
    GroupResponse,
    ProfileResponse,
    SessionHistoryItem,
    SessionHistoryResponse,
    TopCompetencyItem,
)
from ..schemas.user import UserResponse


async def get_user_profile(db: AsyncSession, user_id: uuid.UUID) -> ProfileResponse:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    group = None
    if user.group_id is not None:
        group = (
            await db.execute(select(Group).where(Group.id == user.group_id))
        ).scalar_one_or_none()

    stats = (await db.execute(
            select(
                func.count(PlaySession.id).label('total'),
                func.count(PlaySession.id).filter(PlaySession.state == PlaySessionStates.COMPLETED).label('completed'),
                func.count(PlaySession.id).filter(PlaySession.state == PlaySessionStates.FAILED).label('failed'),
                func.avg(PlaySession.score).label('avg_score'),
            ).where(
                PlaySession.user_id == user_id,
                PlaySession.state.in_([
                    PlaySessionStates.COMPLETED,
                    PlaySessionStates.FAILED,
                    PlaySessionStates.EXPIRED,
                ]),
            )
        )
    ).one()

    sessions_completed = stats.completed or 0
    sessions_failed = stats.failed or 0
    average_score = int(stats.avg_score or 0)

    top_progress = (
        await db.execute(select(UserCompetencyProgress, Competency)
            .join(Competency, UserCompetencyProgress.competency_code == Competency.code)
            .where(UserCompetencyProgress.user_id == user_id)
            .order_by(UserCompetencyProgress.score.desc()).limit(3))
    ).all()

    top_competencies = [
        TopCompetencyItem(code=progress.competency_code, title=comp.title, score=progress.score, progress_percent=min(int(progress.score / 100 * 100), 100))
        for progress, comp in top_progress
    ]

    group_response = None
    if group is not None:
        group_response = GroupResponse(id=group.id, name=group.name, type=group.type.value, parent_id=group.parent_id)

    return ProfileResponse(
        user=UserResponse.model_validate(user),
        group=group_response,
        total_score=user.total_score,
        sessions_completed=sessions_completed,
        sessions_failed=sessions_failed,
        average_score=average_score,
        top_competencies=top_competencies,
    )


async def get_user_sessions_history(db: AsyncSession, user_id: uuid.UUID, limit: int, offset: int) -> SessionHistoryResponse:
    sessions = (await db.execute(select(PlaySession).where(PlaySession.user_id == user_id).order_by(PlaySession.started_at.desc()).limit(limit).offset(offset))).scalars().all()

    items = [
        SessionHistoryItem(
            session_id=s.id,
            scenario_id=s.scenario_id,
            state=s.state.value if hasattr(s.state, 'value') else str(s.state),
            score=s.score,
            started_at=s.started_at,
            finished_at=s.finished_at)
        for s in sessions
    ]

    total = (await db.execute(select(func.count()).where(PlaySession.user_id == user_id))).scalar_one()

    return SessionHistoryResponse(items=items, total=total)
