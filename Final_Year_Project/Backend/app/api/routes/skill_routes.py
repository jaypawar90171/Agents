from fastapi import APIRouter, HTTPException, Depends, Body, UploadFile, File
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.services.skill_service import run_skill_pipeline
import asyncio
import tempfile
import os
import json

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.post("/analyze", response_model=dict)
async def analyze_resume(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Upload PDF resume, run skill gap pipeline, return analysis results.
    
    Accepts multipart/form-data with:
        - file: PDF resume file
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    temp_path = None
    try:
        contents = await file.read()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name
        
        result = await asyncio.to_thread(run_skill_pipeline, temp_path)
        
        profile = result.get("profile")
        expanded_skills = result.get("expanded_skills")
        matches = result.get("matches", [])
        validated_gaps = result.get("validated_gaps", [])
        roadmap = result.get("roadmap", {})
        
        explicit_skills = []
        if profile and hasattr(profile, "skills"):
            for skill in profile.skills:
                explicit_skills.append({
                    "name": skill.name,
                    "context": skill.context,
                    "level": skill.level
                })
        
        implied_skills = []
        if expanded_skills and hasattr(expanded_skills, "implied_skills"):
            for skill in expanded_skills.implied_skills:
                implied_skills.append({
                    "name": skill.name,
                    "inferred_from": skill.inferred_from,
                    "reasoning": skill.reasoning
                })
        
        return {
            "success": True,
            "analysis": {
                "profile": {
                    "summary": profile.summary if profile else "",
                    "skills": explicit_skills,
                    "target_roles": profile.target_roles if profile else [],
                    "seniority_level": profile.seniority_level if profile else ""
                },
                "expanded_skills": {
                    "all_skills": expanded_skills.all_skills if expanded_skills else [],
                    "implied_skills": implied_skills
                },
                "matches": matches,
                "validated_gaps": validated_gaps,
                "roadmap": roadmap
            },
            "fileName": file.filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/save", response_model=dict)
async def save_skill_roadmap(
    analysis_data: dict = Body(...),
    user_id: str = Body(..., alias="userId"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Save a skill roadmap to user's profile.
    
    Body:
        analysis_data: The analysis output from /analyze
        user_id: ID of the user saving the roadmap
    """
    try:
        profile = analysis_data.get("profile", {})
        expanded = analysis_data.get("expanded_skills", {})
        matches = analysis_data.get("matches", [])
        validated_gaps = analysis_data.get("validated_gaps", [])
        roadmap = analysis_data.get("roadmap", {})
        file_name = analysis_data.get("fileName", "resume.pdf")
        
        skill_roadmap_data = {
            "userId": user_id,
            "profileSummary": profile.get("summary", ""),
            "seniorityLevel": profile.get("seniority_level", ""),
            "targetRoles": profile.get("target_roles", []),
            "explicitSkills": profile.get("skills", []),
            "impliedSkills": expanded.get("implied_skills", []),
            "jobMatches": matches,
            "validatedGaps": validated_gaps,
            "roadmap": roadmap,
            "metadata": {
                "createdAt": datetime.utcnow(),
                "fileName": file_name
            }
        }
        
        skill_roadmaps_collection = db.get_collection("skill_roadmaps")
        insert_result = await skill_roadmaps_collection.insert_one(skill_roadmap_data)
        skill_roadmap_id = str(insert_result.inserted_id)
        
        skill_progress = []
        for gap in validated_gaps:
            skill_progress.append({
                "skill": gap.get("skill", ""),
                "isCompleted": False,
                "completedAt": None,
                "notes": ""
            })
        
        user_skill_roadmap_data = {
            "userId": user_id,
            "skillRoadmapId": skill_roadmap_id,
            "status": "in-progress",
            "overallProgress": 0,
            "skillProgress": skill_progress,
            "startDate": datetime.utcnow(),
            "lastAccessed": datetime.utcnow()
        }
        
        user_skill_roadmaps_collection = db.get_collection("user_skill_roadmaps")
        user_insert = await user_skill_roadmaps_collection.insert_one(user_skill_roadmap_data)
        user_skill_roadmap_id = str(user_insert.inserted_id)
        
        saved_roadmap = await skill_roadmaps_collection.find_one({"_id": ObjectId(skill_roadmap_id)})
        saved_roadmap["_id"] = str(saved_roadmap["_id"])
        
        user_skill_roadmap = await user_skill_roadmaps_collection.find_one({"_id": ObjectId(user_skill_roadmap_id)})
        user_skill_roadmap["_id"] = str(user_skill_roadmap["_id"])
        
        return {
            "message": "Skill roadmap saved successfully",
            "roadmap": saved_roadmap,
            "userSkillRoadmap": user_skill_roadmap
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save skill roadmap: {str(e)}")


@router.get("/user/{user_id}", response_model=dict)
async def get_user_skill_roadmaps(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all skill roadmaps for a user"""
    try:
        user_skill_roadmaps_collection = db.get_collection("user_skill_roadmaps")
        skill_roadmaps_collection = db.get_collection("skill_roadmaps")
        
        cursor = user_skill_roadmaps_collection.find({"userId": user_id}).sort("lastAccessed", -1)
        user_skill_roadmaps = await cursor.to_list(length=100)
        
        for user_skill_roadmap in user_skill_roadmaps:
            roadmap = await skill_roadmaps_collection.find_one(
                {"_id": ObjectId(user_skill_roadmap["skillRoadmapId"])}
            )
            if roadmap:
                roadmap["_id"] = str(roadmap["_id"])
                user_skill_roadmap["analysis"] = roadmap
            user_skill_roadmap["_id"] = str(user_skill_roadmap["_id"])
        
        return {"success": True, "roadmaps": user_skill_roadmaps}
        
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch skill roadmaps: {str(e)}"
        )


@router.get("/{roadmap_id}", response_model=dict)
async def get_skill_roadmap(
    roadmap_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific skill roadmap by ID"""
    try:
        skill_roadmaps_collection = db.get_collection("skill_roadmaps")
        roadmap = await skill_roadmaps_collection.find_one({"_id": ObjectId(roadmap_id)})
        
        if not roadmap:
            raise HTTPException(status_code=404, detail="Skill roadmap not found")
        
        roadmap["_id"] = str(roadmap["_id"])
        return {"success": True, "roadmap": roadmap}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch skill roadmap: {str(e)}"
        )


@router.put("/progress", response_model=dict)
async def update_skill_progress(
    user_skill_roadmap_id: str = Body(..., alias="userSkillRoadmapId"),
    skill: Optional[str] = Body(None),
    is_completed: Optional[bool] = Body(None, alias="isCompleted"),
    notes: Optional[str] = Body(None),
    status: Optional[str] = Body(None),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Update skill progress"""
    try:
        user_skill_roadmaps_collection = db.get_collection("user_skill_roadmaps")
        
        user_skill_roadmap = await user_skill_roadmaps_collection.find_one(
            {"_id": ObjectId(user_skill_roadmap_id)}
        )
        
        if not user_skill_roadmap:
            raise HTTPException(status_code=404, detail="User skill roadmap not found")
        
        update_data = {"lastAccessed": datetime.utcnow()}
        
        if skill is not None:
            skill_progress = user_skill_roadmap.get("skillProgress", [])
            found = False
            
            for sp in skill_progress:
                if sp.get("skill") == skill:
                    sp["isCompleted"] = is_completed if is_completed is not None else sp.get("isCompleted", False)
                    if is_completed:
                        sp["completedAt"] = datetime.utcnow()
                    if notes is not None:
                        sp["notes"] = notes
                    found = True
                    break
            
            if not found:
                skill_progress.append({
                    "skill": skill,
                    "isCompleted": is_completed or False,
                    "completedAt": datetime.utcnow() if is_completed else None,
                    "notes": notes or ""
                })
            
            update_data["skillProgress"] = skill_progress
            
            total_skills = len(skill_progress)
            completed_skills = sum(1 for sp in skill_progress if sp.get("isCompleted", False))
            update_data["overallProgress"] = (
                round((completed_skills / total_skills) * 100) if total_skills > 0 else 0
            )
        
        if status:
            update_data["status"] = status
        elif update_data.get("overallProgress") == 100:
            update_data["status"] = "completed"
        
        await user_skill_roadmaps_collection.update_one(
            {"_id": ObjectId(user_skill_roadmap_id)}, {"$set": update_data}
        )
        
        updated_roadmap = await user_skill_roadmaps_collection.find_one(
            {"_id": ObjectId(user_skill_roadmap_id)}
        )
        updated_roadmap["_id"] = str(updated_roadmap["_id"])
        
        return {
            "message": "Progress updated successfully",
            "userSkillRoadmap": updated_roadmap
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update progress: {str(e)}"
        )


@router.delete("/user/{user_skill_roadmap_id}", response_model=dict)
async def delete_user_skill_roadmap(
    user_skill_roadmap_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a user's skill roadmap"""
    try:
        user_skill_roadmaps_collection = db.get_collection("user_skill_roadmaps")
        
        user_skill_roadmap = await user_skill_roadmaps_collection.find_one(
            {"_id": ObjectId(user_skill_roadmap_id)}
        )
        
        if not user_skill_roadmap:
            raise HTTPException(status_code=404, detail="User skill roadmap not found")
        
        skill_roadmap_id = user_skill_roadmap.get("skillRoadmapId")
        
        result = await user_skill_roadmaps_collection.delete_one(
            {"_id": ObjectId(user_skill_roadmap_id)}
        )
        
        if skill_roadmap_id:
            skill_roadmaps_collection = db.get_collection("skill_roadmaps")
            await skill_roadmaps_collection.delete_one({"_id": ObjectId(skill_roadmap_id)})
        
        return {"message": "Skill roadmap deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete skill roadmap: {str(e)}"
        )