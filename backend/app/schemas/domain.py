from pydantic import BaseModel


class UserContext(BaseModel):
    user_id: int
