import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.achievement import Achievement
from ..models.play_session import PlaySession, PlaySessionStates
from ..models.session_event import SessionEvent, SessionEventTypes
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

    user_achievements_map = {ua.achievement_code: ua.unlocked_at for ua in user_achievements}

    achievement_items = [
        AchievementItem(
            code=a.code,
            title=a.title,
            description=a.description,
            icon=a.icon,
            condition=a.condition_code,
            unlocked=a.code in user_achievements_map,
            unlocked_at=user_achievements_map.get(a.code),
        )
        for a in achievements
    ]

    return AchievementsResponse(total=len(achievements), unlocked_count=sum(1 for i in achievement_items if i.unlocked), items=achievement_items)


async def get_user_achievements(db: AsyncSession, user_id: uuid.UUID) -> UserAchievementsResponse:
    rows = (await db.execute(select(UserAchievement, Achievement)
            .join(Achievement, UserAchievement.achievement_code == Achievement.code)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at.desc())
        )
    ).all()

    items = [
        AchievementItem(
            code=a.code,
            title=a.title,
            description=a.description,
            icon=a.icon,
            condition=a.condition_code,
            unlocked=True,
            unlocked_at=ua.unlocked_at,
        )
        for ua, a in rows
    ]

    return UserAchievementsResponse(count=len(items), items=items)


def check_condition(code: str, ctx: dict) -> bool:
    conditions = {
        'complete_any': lambda c: c['completed_count'] >= 1,
        'no_timeout': lambda c: c['session_completed'] and c['timeout_count'] == 0,
        'loyalty_90': lambda c: c['session_completed'] and c['loyalty'] >= 90,
        'safety_95': lambda c: c['session_completed'] and c['safety'] >= 95,
        'conflict_85': lambda c: c['session_completed'] and c['scenario_id'] == 'passenger-conflict' and c['loyalty'] >= 85,
        'medical_80_60': lambda c: c['session_completed'] and c['scenario_id'] == 'medical-incident' and c['safety'] >= 80 and c['loyalty'] >= 60,
        'top10': lambda c: c['user_position'] <= 10,
        'stable_3': lambda c: c['today_completed'] >= 3,
        'fast_3': lambda c: c['fast_choices'] >= 3,
        'comeback': lambda c: c['session_completed'] and c['had_low_scale'],
    }
    checker = conditions.get(code)
    return checker(ctx) if checker is not None else False


async def evaluate_achievements(db: AsyncSession, user_id: uuid.UUID, session: PlaySession) -> list[Achievement]:
    session_completed = session.state == PlaySessionStates.COMPLETED

    completed_count = (await db.execute(select(func.count(PlaySession.id)).where(PlaySession.user_id == user_id, PlaySession.state == PlaySessionStates.COMPLETED))).scalar_one()

    timeout_count = (await db.execute(select(func.count(SessionEvent.id)).where(SessionEvent.session_id == session.id, SessionEvent.event_type == SessionEventTypes.TIMEOUT))).scalar_one()

    events = (await db.execute(select(SessionEvent).where(SessionEvent.session_id == session.id))).scalars().all()

    fast_choices = sum(
        1
        for e in events
        if e.event_type == SessionEventTypes.CHOICE
        and e.timer_sec is not None
        and e.timer_left_sec is not None
        and e.timer_left_sec >= e.timer_sec * 0.7
    )
    had_low_scale = any(
        (e.loyalty_after is not None and e.loyalty_after <= 20)
        or (e.safety_after is not None and e.safety_after <= 20)
        for e in events
    )

    today = datetime.now(timezone.utc).date()
    today_completed = (await db.execute(select(func.count(PlaySession.id))
        .where(PlaySession.user_id == user_id, PlaySession.state == PlaySessionStates.COMPLETED, func.date(PlaySession.finished_at) == today))
    ).scalar_one()

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()

    users_above = (await db.execute(select(func.count(User.id)).where(User.total_score > (user.total_score if user else 0)))).scalar_one()

    ctx = {
        'completed_count': completed_count,
        'session_completed': session_completed,
        'timeout_count': timeout_count,
        'loyalty': session.loyalty,
        'safety': session.safety,
        'scenario_id': session.scenario_id,
        'user_position': users_above + 1,
        'today_completed': today_completed,
        'fast_choices': fast_choices,
        'had_low_scale': had_low_scale,
    }

    achievements = (await db.execute(select(Achievement))).scalars().all()

    existing = set(
        (
            await db.execute(
                select(UserAchievement.achievement_code).where(UserAchievement.user_id == user_id)
            )
        ).scalars().all()
    )

    new_achievements = []
    for achievement in achievements:
        if achievement.code in existing:
            continue
        if check_condition(achievement.condition_code, ctx):
            db.add(
                UserAchievement(
                    user_id=user_id,
                    achievement_code=achievement.code,
                    session_id=session.id,
                    unlocked_at=datetime.now(timezone.utc),
                )
            )
            new_achievements.append(achievement)

    return new_achievements
