from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.roadmap_service import (
    generate_roadmap,
    RoadmapValidationError,
    RoadmapNotFoundError,
    RoadmapServiceError,
)

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


class RoadmapRequest(BaseModel):
    company_name: str = Field(..., min_length=1, description="Target company name (e.g. Google, Amazon)")


@router.post("/generate")
def post_roadmap_generate(body: RoadmapRequest):
    """
    Generate a skill-based learning roadmap for jobs at the given company.
    Returns markdown roadmap and the list of jobs used to build it.
    """
    company_name = (body.company_name or "").strip()
    if len(company_name) < 3:
        raise HTTPException(
            status_code=400,
            detail="Company name must be at least 3 characters",
        )
    try:
        result = generate_roadmap(company_name)
        return result
    except RoadmapValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RoadmapNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RoadmapServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
