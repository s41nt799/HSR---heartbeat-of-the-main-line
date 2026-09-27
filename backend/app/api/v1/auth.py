from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.security import create_access_token
from ...models.base import get_db
from ...models.user import User
from ...schemas.auth import AuthResponse, RegisterRequest
from ...schemas.user import UserResponse
from ...services.auth_service import authenticate_user, register
from ..deps import get_current_user

auth_router = APIRouter(prefix='/api/v1/auth', tags=['Auth'])


@auth_router.post('/register', status_code=status.HTTP_201_CREATED, response_model=AuthResponse,
    summary='Регистрация нового проводника', description='Создаёт пользователя, прогресс по компетенциям и приветственное уведомление. Возвращает JWT токен на 24 часа',
    responses={
            409: {'description': 'Email уже зарегистрирован'},
            422: {'description': 'Некорректные данные или группа не найдена'},
            500: {'description': 'Дефолтная группа не найдена. Проверьте сиды'},
        })
async def post_register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):  # noqa: B008
    new_user = await register(db, data)
    new_token = create_access_token(new_user.id)
    validated_user = UserResponse.model_validate(new_user)
    return AuthResponse(user=validated_user, access_token=new_token)


@auth_router.post('/login', status_code=status.HTTP_200_OK, response_model=AuthResponse,
    summary='Вход по email и паролю', description='Возвращает пользователя и JWT токен на 24 часа. Ошибка 401 одинаковая для неверного email и пароля',
    responses={
            401: {'description': 'Неверный email или пароль'},
            422: {'description': 'Некорректные данные'},
        })
async def post_login(data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):  # noqa: B008
    user = await authenticate_user(db, data.username, data.password)
    token = create_access_token(user.id)
    validated_user = UserResponse.model_validate(user)
    return AuthResponse(user=validated_user, access_token=token)


@auth_router.get('/me', status_code=status.HTTP_200_OK, response_model=UserResponse,
    summary='Получить текущего пользователя', description='Возвращает данные пользователя по JWT токену из заголовка Authorization',
    responses={401: {'description': 'Токен отсутствует, невалиден или истёк'}})
async def get_me(current_user: User = Depends(get_current_user)):  # noqa: B008
    return UserResponse.model_validate(current_user)
