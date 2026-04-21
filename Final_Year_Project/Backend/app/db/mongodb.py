# backend/database/mongodb.py
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, IndexModel
import os
from typing import Optional

# Database name must be set (URI often has no default DB)
DB_NAME = os.getenv("DB_NAME", "learnlaunch")


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None

    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        mongodb_url = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI", "mongodb://localhost:27017")
        cls.client = AsyncIOMotorClient("mongodb+srv://jayp90171_db_user:JVHmND5i0xMwbDZ9@langgraph.lanwnpu.mongodb.net/")

        # Create indexes
        await cls.create_indexes()
        print("✅ Connected to MongoDB")

    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("❌ Closed MongoDB connection")

    @classmethod
    async def create_indexes(cls):
        """Create database indexes for better performance"""
        db = cls.client.get_database(DB_NAME)
        
        # Roadmap indexes
        roadmaps_collection = db.get_collection("roadmaps")
        await roadmaps_collection.create_indexes([
            IndexModel([("targetCompany", ASCENDING), ("roleTitle", ASCENDING)]),
            IndexModel([("skills", ASCENDING)]),
            IndexModel([("metadata.createdAt", ASCENDING)])
        ])
        
        # UserRoadmap indexes
        user_roadmaps_collection = db.get_collection("user_roadmaps")
        await user_roadmaps_collection.create_indexes([
            IndexModel([("userId", ASCENDING), ("roadmapId", ASCENDING)], unique=True),
            IndexModel([("userId", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("lastAccessed", ASCENDING)])
        ])
        
        # Skill Roadmap indexes
        skill_roadmaps_collection = db.get_collection("skill_roadmaps")
        await skill_roadmaps_collection.create_indexes([
            IndexModel([("userId", ASCENDING)]),
            IndexModel([("metadata.createdAt", ASCENDING)])
        ])
        
        # User Skill Roadmap indexes
        user_skill_roadmaps_collection = db.get_collection("user_skill_roadmaps")
        await user_skill_roadmaps_collection.create_indexes([
            IndexModel([("userId", ASCENDING), ("skillRoadmapId", ASCENDING)], unique=True),
            IndexModel([("userId", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("lastAccessed", ASCENDING)])
        ])
    
    @classmethod
    def get_database(cls):
        """Get database instance"""
        return cls.client.get_database(DB_NAME)


# Dependency to get database
async def get_database():
    return MongoDB.get_database()