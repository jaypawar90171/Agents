from pydantic import BaseModel, Field, BeforeValidator, PlainSerializer
from typing import List, Optional, Annotated
from datetime import datetime
from bson import ObjectId


def _validate_object_id(v):
    if isinstance(v, ObjectId):
        return v
    if ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


# Pydantic v2–compatible ObjectId type (serializes to str in JSON)
PyObjectId = Annotated[
    ObjectId,
    BeforeValidator(_validate_object_id),
    PlainSerializer(lambda x: str(x), return_type=str),
]


class Resource(BaseModel):
    name: str
    url: Optional[str] = ""


class StudyPlanItem(BaseModel):
    day_range: str = Field(alias="dayRange")
    content: str

    class Config:
        populate_by_name = True


class Week(BaseModel):
    week_number: int = Field(alias="weekNumber")
    topic: str
    what_youll_learn: List[str] = Field(default=[], alias="whatYoullLearn")
    study_plan: List[StudyPlanItem] = Field(default=[], alias="studyPlan")
    hands_on_practice: List[str] = Field(default=[], alias="handsOnPractice")
    resources: List[Resource] = Field(default=[])
    success_criteria: List[str] = Field(default=[], alias="successCriteria")

    class Config:
        populate_by_name = True


class RoadmapMetadata(BaseModel):
    source_url: Optional[str] = Field(None, alias="sourceUrl")
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")

    class Config:
        populate_by_name = True


class RoadmapCreate(BaseModel):
    title: str
    target_company: Optional[str] = Field(None, alias="targetCompany")
    role_title: Optional[str] = Field(None, alias="roleTitle")
    total_duration_weeks: int = Field(0, alias="totalDurationWeeks")
    total_skills: int = Field(0, alias="totalSkills")
    skills: List[str] = Field(default=[])
    weeks: List[Week] = Field(default=[])
    metadata: RoadmapMetadata = Field(default_factory=RoadmapMetadata)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class RoadmapInDB(RoadmapCreate):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True


class RoadmapResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    target_company: Optional[str] = Field(None, alias="targetCompany")
    role_title: Optional[str] = Field(None, alias="roleTitle")
    total_duration_weeks: int = Field(alias="totalDurationWeeks")
    total_skills: int = Field(alias="totalSkills")
    skills: List[str]
    weeks: List[Week]
    metadata: RoadmapMetadata

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}