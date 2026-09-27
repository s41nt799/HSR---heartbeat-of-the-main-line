from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .user import UserResponse


class RegisterRequest(BaseModel):
    email: Annotated[EmailStr, Field(max_length=255)]
    password: Annotated[str, Field(min_length=8)]
    display_name: Annotated[str, Field(min_length=1, max_length=50)]
    group_id: Annotated[str | None, Field(max_length=20)] = None

    @field_validator('email', mode='before')
    @classmethod
    def normalize_email(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    model_config = ConfigDict(extra='forbid')

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = 'bearer'
