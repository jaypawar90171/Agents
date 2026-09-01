from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum
from bson import ObjectId


class RoadmapStatus(str, Enum):
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    PAUSED = "paused"


class WeeklyProgress(BaseModel):
    week_number: int = Field(alias="weekNumber")
    is_completed: bool = Field(default=False, alias="isCompleted")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class UserRoadmapCreate(BaseModel):
    user_id: str = Field(alias="userId")
    roadmap_id: str = Field(alias="roadmapId")
    status: RoadmapStatus = RoadmapStatus.IN_PROGRESS
    overall_progress: int = Field(default=0, alias="overallProgress")
    weekly_progress: List[WeeklyProgress] = Field(default=[], alias="weeklyProgress")
    skills_mastered: List[str] = Field(default=[], alias="skillsMastered")
    start_date: datetime = Field(default_factory=datetime.utcnow, alias="startDate")
    last_accessed: datetime = Field(default_factory=datetime.utcnow, alias="lastAccessed")

    class Config:
        populate_by_name = True


class UserRoadmapUpdate(BaseModel):
    week_number: Optional[int] = Field(None, alias="weekNumber")
    is_completed: Optional[bool] = Field(None, alias="isCompleted")
    notes: Optional[str] = None
    skills_mastered: Optional[List[str]] = Field(None, alias="skillsMastered")
    status: Optional[RoadmapStatus] = None

    class Config:
        populate_by_name = True


class UserRoadmapInDB(UserRoadmapCreate):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class UserRoadmapResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str = Field(alias="userId")
    roadmap_id: str = Field(alias="roadmapId")
    status: RoadmapStatus
    overall_progress: int = Field(alias="overallProgress")
    weekly_progress: List[WeeklyProgress] = Field(alias="weeklyProgress")
    skills_mastered: List[str] = Field(alias="skillsMastered")
    start_date: datetime = Field(alias="startDate")
    last_accessed: datetime = Field(alias="lastAccessed")
    roadmap: Optional[dict] = None  # Populated roadmap details

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}