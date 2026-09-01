from fastapi import APIRouter
from app.services.job_service import fetch_jobs

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/")
def get_jobs():
    return {"jobs": fetch_jobs()}