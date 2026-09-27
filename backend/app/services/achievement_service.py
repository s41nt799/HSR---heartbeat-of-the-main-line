import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.achievement import Achievement
from ..models.play_session import PlaySession, PlaySessionStates
from ..models.user import User
from ..models.user_achievement import UserAchievement
from ..schemas.achievement import (
    AchievementItem,
    AchievementsResponse,
    UserAchievementsResponse,
)


async def get_achievements_progress(db: AsyncSession, user_id: uuid.UUID) -> AchievementsResponse:
    achievements = (await db.execute(select(Achievement))).scalars().all()
    user_achievements = (await db.execute(select(UserAchievement).where(UserAchievement.user_id == user_id))).scalars().all()

    user_achievements_map = {achievement.achievement_code: achievement.unlocked_at for achievement in user_achievements}

    achievement_items = [AchievementItem(
        code=achievement.code,
        title=achievement.title,
        description=achievement.description,
        icon=achievement.icon,
        condition=achievement.condition_code,
        unlocked=achievement.code in user_achievements_map,
        unlocked_at=user_achievements_map.get(achievement.code),
    ) for achievement in achievements]

    total = len(achievements)
    unlocked_count = sum(1 for item in achievement_items if item.unlocked)

    return AchievementsResponse(
        total=total,
        unlocked_count=unlocked_count,
        items=achievement_items,
    )


async def get_user_achievements(db: AsyncSession, user_id: uuid.UUID) -> UserAchievementsResponse:
    rows = (await db.execute(select(UserAchievement, Achievement)
            .join(Achievement, UserAchievement.achievement_code == Achievement.code)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at.desc()))
    ).all()

    items = [
        AchievementItem(
            code=achievement.code,
            title=achievement.title,
            description=achievement.description,
            icon=achievement.icon,
            condition=achievement.condition_code,
            unlocked=True,
            unlocked_at=user_achievement.unlocked_at,
        )
        for user_achievement, achievement in rows
    ]

    return UserAchievementsResponse(count=len(items), items=items)


async def evaluate_achievements(db: AsyncSession, user_id: uuid.UUID, session: PlaySession) -> list[Achievement]:
    completed_count = (await db.execute(select(func.count(PlaySession.id))
        .where(PlaySession.user_id == user_id, PlaySession.state == PlaySessionStates.COMPLETED))).scalar_one()

    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()

    user_level = user.level if user else 1
    session_score = session.score

    context = {
        'completed_count': completed_count,
        'session_score': session_score,
        'user_level': user_level,
    }

    achievements = (await db.execute(select(Achievement))).scalars().all()

    existing_achievements = (await db.execute(select(UserAchievement.achievement_code)
        .where(UserAchievement.user_id == user_id))).scalars().all()
    existing_set = set(existing_achievements)

    new_achievements = []

    for achievement in achievements:
        if achievement.code in existing_set:
            continue

        if check_condition(achievement.code, context):
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_code=achievement.code,
                session_id=session.id,
                unlocked_at=datetime.now(timezone.utc),
            )
            db.add(user_achievement)
            new_achievements.append(achievement)

    return new_achievements


def check_condition(code: str, context: dict) -> bool:
    conditions = {
        'first_session': lambda ctx: ctx['completed_count'] >= 1,
        'five_sessions': lambda ctx: ctx['completed_count'] >= 5,
        'ten_sessions': lambda ctx: ctx['completed_count'] >= 10,
        'score_100': lambda ctx: ctx['session_score'] >= 100,
        'score_200': lambda ctx: ctx['session_score'] >= 200,
        'level_5': lambda ctx: ctx['user_level'] >= 5,
    }

    checker = conditions.get(code)
    if checker is None:
        return False

    return checker(context)
