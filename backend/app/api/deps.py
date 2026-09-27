from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.redis_client import get_redis_client
from ..core.security import get_user_by_token
from ..models.base import get_db
from ..models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/v1/auth/login')

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:  # noqa: B008
    user = await get_user_by_token(token, db)
    return user

async def get_redis():
    return get_redis_client()
