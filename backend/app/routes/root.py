from fastapi import APIRouter

router = APIRouter()


@router.get('/')
def root() -> dict:
    return {'message': 'EduNova AI backend online'}
