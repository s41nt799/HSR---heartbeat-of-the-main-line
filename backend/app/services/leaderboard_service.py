import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.play_session import PlaySession, PlaySessionStates
from ..models.user import User
from ..schemas.leaderboard import LeaderboardItem, LeaderboardResponse


async def get_leaderboard(db: AsyncSession, user_id: uuid.UUID, limit: int) -> LeaderboardResponse:
    users = (await db.execute(select(User)
            .where(User.total_score > 0)
            .order_by(User.total_score.desc(), User.display_name.asc())
            .limit(limit))
    ).scalars().all()

    items = []
    for position, user in enumerate(users, start=1):
        sessions_count = (await db.execute(select(func.count(PlaySession.id))
                .where(
                    PlaySession.user_id == user.id,
                    PlaySession.state.in_([
                        PlaySessionStates.COMPLETED,
                        PlaySessionStates.FAILED,
                        PlaySessionStates.EXPIRED,
                        PlaySessionStates.ABANDONED,
                    ]),
                )
            )
        ).scalar_one()

        items.append(
            LeaderboardItem(
                position=position,
                user_id=user.id,
                username=user.display_name,
                level=user.level,
                total_score=user.total_score,
                sessions_completed=sessions_count,
            )
        )

    current_user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()

    current_user_position = None
    if current_user is not None:
        users_above = (await db.execute(select(func.count(User.id)).where(User.total_score > current_user.total_score))).scalar_one()
        current_user_position = users_above + 1

    total = (await db.execute(select(func.count(User.id)).where(User.total_score > 0))).scalar_one()

    return LeaderboardResponse(total=total, items=items, current_user_position=current_user_position)
