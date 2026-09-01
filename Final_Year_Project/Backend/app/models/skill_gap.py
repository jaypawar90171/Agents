from pydantic import BaseModel, Field, BeforeValidator, PlainSerializer
from typing import List, Optional, Annotated
from datetime import datetime
from bson import ObjectId
from enum import Enum


def _validate_object_id(v):
    if isinstance(v, ObjectId):
        return v
    if ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[
    ObjectId,
    BeforeValidator(_validate_object_id),
    PlainSerializer(lambda x: str(x), return_type=str),
]


class SkillContextModel(BaseModel):
    name: str
    context: str
    level: str


class ImpliedSkillModel(BaseModel):
    name: str
    inferred_from: str
    reasoning: str


class ValidatedGapModel(BaseModel):
    skill: str
    importance: str
    frequency: int
    validation_reason: Optional[str] = None


class LearningResource(BaseModel):
    title: str
    url: str
    resource_type: str
    is_free: bool


class WeeklyTask(BaseModel):
    week_label: str
    topic: str
    tasks: List[str]
    milestone: str


class SkillLearningStep(BaseModel):
    skill: str
    importance: str
    why_it_matters: str
    leverage_from_background: str
    time_estimate: str
    resources: List[LearningResource]
    weekly_breakdown: List[WeeklyTask]
    capstone_project: str
    resume_bullet: str


class SkillGapRoadmapCreate(BaseModel):
    user_id: str = Field(alias="userId")
    profile_summary: str = Field(alias="profileSummary")
    seniority_level: str = Field(alias="seniorityLevel")
    target_roles: List[str] = Field(default=[], alias="targetRoles")
    explicit_skills: List[dict] = Field(default=[], alias="explicitSkills")
    implied_skills: List[dict] = Field(default=[], alias="impliedSkills")
    job_matches: List[dict] = Field(default=[], alias="jobMatches")
    validated_gaps: List[dict] = Field(default=[], alias="validatedGaps")
    roadmap: dict = Field(default={})
    metadata: dict = Field(default={})

    class Config:
        populate_by_name = True


class SkillGapRoadmapInDB(SkillGapRoadmapCreate):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class SkillGapRoadmapResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str = Field(alias="userId")
    profile_summary: str = Field(alias="profileSummary")
    seniority_level: str = Field(alias="seniorityLevel")
    target_roles: List[str] = Field(alias="targetRoles")
    explicit_skills: List[dict] = Field(alias="explicitSkills")
    implied_skills: List[dict] = Field(alias="impliedSkills")
    job_matches: List[dict] = Field(alias="jobMatches")
    validated_gaps: List[dict] = Field(alias="validatedGaps")
    roadmap: dict
    metadata: dict

    class Config:
        populate_by_name = True


class SkillStatus(str, Enum):
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    PAUSED = "paused"


class SkillProgressItem(BaseModel):
    skill: str
    is_completed: bool = Field(default=False, alias="isCompleted")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class UserSkillRoadmapCreate(BaseModel):
    user_id: str = Field(alias="userId")
    skill_roadmap_id: str = Field(alias="skillRoadmapId")
    status: SkillStatus = SkillStatus.IN_PROGRESS
    overall_progress: int = Field(default=0, alias="overallProgress")
    skill_progress: List[SkillProgressItem] = Field(default=[], alias="skillProgress")
    start_date: datetime = Field(default_factory=datetime.utcnow, alias="startDate")
    last_accessed: datetime = Field(default_factory=datetime.utcnow, alias="lastAccessed")

    class Config:
        populate_by_name = True


class UserSkillRoadmapUpdate(BaseModel):
    skill: Optional[str] = None
    is_completed: Optional[bool] = Field(None, alias="isCompleted")
    notes: Optional[str] = None
    status: Optional[SkillStatus] = None

    class Config:
        populate_by_name = True


class UserSkillRoadmapInDB(UserSkillRoadmapCreate):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True


class UserSkillRoadmapResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str = Field(alias="userId")
    skill_roadmap_id: str = Field(alias="skillRoadmapId")
    status: SkillStatus
    overall_progress: int = Field(alias="overallProgress")
    skill_progress: List[SkillProgressItem] = Field(alias="skillProgress")
    start_date: datetime = Field(alias="startDate")
    last_accessed: datetime = Field(alias="lastAccessed")
    analysis: Optional[dict] = None

    class Config:
        populate_by_name = True