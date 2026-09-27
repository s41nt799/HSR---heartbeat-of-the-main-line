from fastapi import APIRouter

from .achievements import achievement_router
from .analytics import analytics_router
from .auth import auth_router
from .leaderboard import leaderboard_router
from .notifications import notifications_router
from .profile import profile_router
from .scenarios import scenarios_router
from .session import session_router

api_routers = APIRouter()
api_routers.include_router(auth_router)
api_routers.include_router(scenarios_router)
api_routers.include_router(session_router)
api_routers.include_router(analytics_router)
api_routers.include_router(profile_router)
api_routers.include_router(achievement_router)
api_routers.include_router(leaderboard_router)
api_routers.include_router(notifications_router)
