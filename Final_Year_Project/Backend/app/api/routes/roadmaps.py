# backend/routes/roadmaps.py
from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.roadmap import RoadmapCreate, RoadmapResponse
from app.models.user_roadmap import (
    UserRoadmapCreate,
    UserRoadmapResponse,
    UserRoadmapUpdate,
    WeeklyProgress,
)
from app.db.mongodb import get_database
from app.utils.roadmap_parser import parse_roadmap_content
import json

router = APIRouter(prefix="/api/roadmaps", tags=["roadmaps"])


@router.post("/save", response_model=dict)
async def save_roadmap(
    roadmap_data: dict = Body(...),
    user_id: str = Body(..., alias="userId"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Save a new roadmap and create user progress tracking

    Body:
        roadmap_data: Parsed roadmap data (from frontend or raw markdown)
        user_id: ID of the user saving the roadmap
    """
    try:
        # Check if similar roadmap exists
        roadmaps_collection = db.get_collection("roadmaps")
        existing_roadmap = await roadmaps_collection.find_one(
            {
                "title": roadmap_data.get("title"),
                "targetCompany": roadmap_data.get("targetCompany"),
                "roleTitle": roadmap_data.get("roleTitle"),
            }
        )

        if existing_roadmap:
            roadmap_id = str(existing_roadmap["_id"])
            roadmap = existing_roadmap
        else:
            # Create new roadmap
            roadmap_insert = await roadmaps_collection.insert_one(roadmap_data)
            roadmap_id = str(roadmap_insert.inserted_id)
            roadmap = await roadmaps_collection.find_one(
                {"_id": roadmap_insert.inserted_id}
            )

        # Check if user already has this roadmap
        user_roadmaps_collection = db.get_collection("user_roadmaps")
        existing_user_roadmap = await user_roadmaps_collection.find_one(
            {"userId": user_id, "roadmapId": roadmap_id}
        )

        if existing_user_roadmap:
            # Update existing
            await user_roadmaps_collection.update_one(
                {"_id": existing_user_roadmap["_id"]},
                {"$set": {"lastAccessed": datetime.utcnow(), "status": "in-progress"}},
            )
            user_roadmap = await user_roadmaps_collection.find_one(
                {"_id": existing_user_roadmap["_id"]}
            )
        else:
            # Create new user roadmap with initial progress
            weekly_progress = [
                {"weekNumber": week["weekNumber"], "isCompleted": False}
                for week in roadmap_data.get("weeks", [])
            ]

            user_roadmap_data = {
                "userId": user_id,
                "roadmapId": roadmap_id,
                "status": "in-progress",
                "overallProgress": 0,
                "weeklyProgress": weekly_progress,
                "skillsMastered": [],
                "startDate": datetime.utcnow(),
                "lastAccessed": datetime.utcnow(),
            }

            user_roadmap_insert = await user_roadmaps_collection.insert_one(
                user_roadmap_data
            )
            user_roadmap = await user_roadmaps_collection.find_one(
                {"_id": user_roadmap_insert.inserted_id}
            )

        # Convert ObjectIds to strings for response
        roadmap["_id"] = str(roadmap["_id"])
        user_roadmap["_id"] = str(user_roadmap["_id"])

        return {
            "message": "Roadmap saved successfully",
            "roadmap": roadmap,
            "userRoadmap": user_roadmap,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save roadmap: {str(e)}")


@router.post("/parse-and-save", response_model=dict)
async def parse_and_save_roadmap(
    content: str = Body(...),
    user_id: str = Body(..., alias="userId"),
    job_details: Optional[dict] = Body(None, alias="jobDetails"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Parse markdown content and save roadmap (backend parsing)

    Body:
        content: Markdown roadmap content
        user_id: ID of the user
        job_details: Optional dict with company, role, location
    """
    try:
        # Parse markdown content
        parsed_data = parse_roadmap_content(content, job_details)
        print("Parsed data: " + json.dumps(parsed_data))
        # Use the save endpoint logic
        return await save_roadmap(roadmap_data=parsed_data, user_id=user_id, db=db)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to parse and save: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=dict)
async def get_user_roadmaps(
    user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all roadmaps for a specific user"""
    try:
        user_roadmaps_collection = db.get_collection("user_roadmaps")
        roadmaps_collection = db.get_collection("roadmaps")

        # Fetch user roadmaps
        cursor = user_roadmaps_collection.find({"userId": user_id}).sort(
            "lastAccessed", -1
        )
        user_roadmaps = await cursor.to_list(length=100)

        # Populate roadmap details
        for user_roadmap in user_roadmaps:
            roadmap = await roadmaps_collection.find_one(
                {"_id": ObjectId(user_roadmap["roadmapId"])}
            )
            if roadmap:
                roadmap["_id"] = str(roadmap["_id"])
                user_roadmap["roadmap"] = roadmap
            user_roadmap["_id"] = str(user_roadmap["_id"])

        return {"success": True, "roadmaps": user_roadmaps}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch roadmaps: {str(e)}"
        )


@router.get("/{roadmap_id}", response_model=dict)
async def get_roadmap(
    roadmap_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific roadmap by ID"""
    try:
        roadmaps_collection = db.get_collection("roadmaps")
        roadmap = await roadmaps_collection.find_one({"_id": ObjectId(roadmap_id)})

        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        roadmap["_id"] = str(roadmap["_id"])
        return {"success": True, "roadmap": roadmap}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch roadmap: {str(e)}"
        )


@router.put("/progress", response_model=dict)
async def update_progress(
    user_roadmap_id: str = Body(..., alias="userRoadmapId"),
    week_number: Optional[int] = Body(None, alias="weekNumber"),
    is_completed: Optional[bool] = Body(None, alias="isCompleted"),
    notes: Optional[str] = Body(None),
    skills_mastered: Optional[List[str]] = Body(None, alias="skillsMastered"),
    status: Optional[str] = Body(None),
    sub_progress: Optional[dict] = Body(None, alias="subProgress"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Update user roadmap progress"""
    try:
        user_roadmaps_collection = db.get_collection("user_roadmaps")

        # Fetch user roadmap
        user_roadmap = await user_roadmaps_collection.find_one(
            {"_id": ObjectId(user_roadmap_id)}
        )

        if not user_roadmap:
            raise HTTPException(status_code=404, detail="User roadmap not found")

        update_data = {"lastAccessed": datetime.utcnow()}

        # Update weekly progress
        if week_number is not None:
            weekly_progress = user_roadmap.get("weeklyProgress", [])
            week_found = False

            for week in weekly_progress:
                if week["weekNumber"] == week_number:
                    week["isCompleted"] = (
                        is_completed
                        if is_completed is not None
                        else week.get("isCompleted", False)
                    )
                    if is_completed:
                        week["completedAt"] = datetime.utcnow()
                    if notes is not None:
                        week["notes"] = notes
                    if sub_progress is not None:
                        week["subProgress"] = sub_progress
                    week_found = True
                    break

            if not week_found:
                # Add new week progress
                new_week = {
                    "weekNumber": week_number,
                    "isCompleted": is_completed or False,
                    "completedAt": datetime.utcnow() if is_completed else None,
                    "notes": notes or "",
                }
                if sub_progress is not None:
                    new_week["subProgress"] = sub_progress
                weekly_progress.append(new_week)

            update_data["weeklyProgress"] = weekly_progress

            # Calculate overall progress based on subProgress if available
            roadmaps_collection = db.get_collection("roadmaps")
            roadmap = await roadmaps_collection.find_one(
                {"_id": ObjectId(user_roadmap.get("roadmapId"))}
            )

            if roadmap and sub_progress is not None:
                # Calculate progress based on sub-items
                total_items = 0
                completed_items = 0
                for wp in weekly_progress:
                    sp = wp.get("subProgress", {})
                    what_you_learn = sp.get("whatYoullLearn", [])
                    study_plan = sp.get("studyPlan", [])
                    hands_on = sp.get("handsOnPractice", [])

                    # Get corresponding week from roadmap to know total items
                    week_num = wp.get("weekNumber")
                    roadmap_week = next(
                        (
                            w
                            for w in roadmap.get("weeks", [])
                            if w.get("weekNumber") == week_num
                        ),
                        None,
                    )

                    if roadmap_week:
                        total_items += len(roadmap_week.get("whatYoullLearn", []))
                        total_items += len(roadmap_week.get("studyPlan", []))
                        total_items += len(roadmap_week.get("handsOnPractice", []))

                    completed_items += sum(what_you_learn)
                    completed_items += sum(study_plan)
                    completed_items += sum(hands_on)

                if total_items > 0:
                    update_data["overallProgress"] = round(
                        (completed_items / total_items) * 100
                    )
                else:
                    total_weeks = len(weekly_progress)
                    completed_weeks = sum(
                        1 for w in weekly_progress if w.get("isCompleted", False)
                    )
                    update_data["overallProgress"] = (
                        round((completed_weeks / total_weeks) * 100)
                        if total_weeks > 0
                        else 0
                    )
            else:
                # Fallback to week-level progress
                total_weeks = len(weekly_progress)
                completed_weeks = sum(
                    1 for w in weekly_progress if w.get("isCompleted", False)
                )
                update_data["overallProgress"] = (
                    round((completed_weeks / total_weeks) * 100)
                    if total_weeks > 0
                    else 0
                )

        # Update skills mastered
        if skills_mastered is not None:
            existing_skills = set(user_roadmap.get("skillsMastered", []))
            existing_skills.update(skills_mastered)
            update_data["skillsMastered"] = list(existing_skills)

        # Update status
        if status:
            update_data["status"] = status
        elif update_data.get("overallProgress") == 100:
            update_data["status"] = "completed"

        # Perform update
        await user_roadmaps_collection.update_one(
            {"_id": ObjectId(user_roadmap_id)}, {"$set": update_data}
        )

        # Fetch updated document
        updated_roadmap = await user_roadmaps_collection.find_one(
            {"_id": ObjectId(user_roadmap_id)}
        )
        updated_roadmap["_id"] = str(updated_roadmap["_id"])

        return {
            "message": "Progress updated successfully",
            "userRoadmap": updated_roadmap,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update progress: {str(e)}"
        )


@router.delete("/user/{user_roadmap_id}", response_model=dict)
async def delete_user_roadmap(
    user_roadmap_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a user's roadmap"""
    try:
        user_roadmaps_collection = db.get_collection("user_roadmaps")

        result = await user_roadmaps_collection.delete_one(
            {"_id": ObjectId(user_roadmap_id)}
        )

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User roadmap not found")

        return {"message": "Roadmap deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete roadmap: {str(e)}"
        )
