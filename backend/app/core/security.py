import os
import uuid
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User

load_dotenv()

SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = os.environ.get('ALGORITHM', 'HS256')
ACCESS_TOKEN_TTL_MINUTES = int(os.environ.get('ACCESS_TOKEN_TTL_MINUTES', '1440'))

pwd_context = CryptContext(schemes=['argon2'], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_user_by_token(token: str, db: AsyncSession) -> User:
    try:
        payload: dict = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token', headers={'WWW-Authenticate': 'Bearer'})
    user_id_str = payload.get('sub')
    if user_id_str is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token', headers={'WWW-Authenticate': 'Bearer'})

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token', headers={'WWW-Authenticate': 'Bearer'})

    user_db = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user_db is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found', headers={'WWW-Authenticate': 'Bearer'})
    return user_db
