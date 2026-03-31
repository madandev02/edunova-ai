from pydantic import BaseModel, EmailStr, Field


class UserAuthOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    level: str
    learning_style: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    level: str = 'BEGINNER'
    learning_style: str = 'MIXED'


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserAuthOut
