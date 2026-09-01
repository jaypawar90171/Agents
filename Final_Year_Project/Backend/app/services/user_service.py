"""
User service for syncing Clerk user data with MongoDB
Handles creation, updates, and deletion of users
"""
import logging
from datetime import datetime
from app.db.connection import db

logger = logging.getLogger(__name__)

# Get or create the users collection
users_collection = db["users"]


async def sync_user_created(user_data: dict):
    """
    Sync a newly created user from Clerk to MongoDB
    
    Args:
        user_data: User data from Clerk webhook payload
    """
    try:
        clerk_id = user_data.get("id")
        
        if not clerk_id:
            logger.error("Missing clerk user ID in webhook data")
            return
        
        # Extract user information
        first_name = user_data.get("first_name", "")
        last_name = user_data.get("last_name", "")
        name = f"{first_name} {last_name}".strip()
        
        # Extract primary email
        email_addresses = user_data.get("email_addresses", [])
        email = None
        if email_addresses:
            email = email_addresses[0].get("email_address")
        
        if not email:
            logger.error(f"No email found for user {clerk_id}")
            return
        
        # Prepare user document
        user_doc = {
            "clerk_id": clerk_id,
            "name": name,
            "email": email,
            "bookmarked_jobs": [],
            "saved_roadmaps": [],
            "created_at": datetime.utcnow()
        }
        
        # Insert or update user (upsert)
        result = await users_collection.update_one(
            {"clerk_id": clerk_id},
            {"$setOnInsert": user_doc},
            upsert=True
        )
        
        logger.info(f"User sync successful. ID: {clerk_id}, Email: {email}")
        
    except Exception as e:
        logger.error(f"Error syncing user creation: {str(e)}")
        raise


async def sync_user_updated(user_data: dict):
    """
    Sync an updated user from Clerk to MongoDB
    
    Args:
        user_data: User data from Clerk webhook payload
    """
    try:
        clerk_id = user_data.get("id")
        
        if not clerk_id:
            logger.error("Missing clerk user ID in webhook data")
            return
        
        # Extract updated user information
        first_name = user_data.get("first_name", "")
        last_name = user_data.get("last_name", "")
        name = f"{first_name} {last_name}".strip()
        
        # Extract primary email
        email_addresses = user_data.get("email_addresses", [])
        email = None
        if email_addresses:
            email = email_addresses[0].get("email_address")
        
        # Prepare update data
        update_data = {}
        if name:
            update_data["name"] = name
        if email:
            update_data["email"] = email
        
        if not update_data:
            logger.info(f"No update data for user {clerk_id}")
            return
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update user
        result = await users_collection.update_one(
            {"clerk_id": clerk_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            logger.warning(f"User not found for update: {clerk_id}")
        else:
            logger.info(f"User updated successfully. ID: {clerk_id}")
        
    except Exception as e:
        logger.error(f"Error syncing user update: {str(e)}")
        raise


async def sync_user_deleted(user_data: dict):
    """
    Handle deletion of a user from Clerk
    
    Two approaches:
    1. Hard delete: Remove user from database
    2. Soft delete: Mark user as deleted with a flag
    
    Currently using soft delete (recommended) to maintain referential integrity
    
    Args:
        user_data: User data from Clerk webhook payload
    """
    try:
        clerk_id = user_data.get("id")
        
        if not clerk_id:
            logger.error("Missing clerk user ID in webhook data")
            return
        
        # Soft delete: Mark user as deleted instead of removing
        result = await users_collection.update_one(
            {"clerk_id": clerk_id},
            {
                "$set": {
                    "deleted": True,
                    "deleted_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            logger.warning(f"User not found for deletion: {clerk_id}")
        else:
            logger.info(f"User marked as deleted. ID: {clerk_id}")
        
    except Exception as e:
        logger.error(f"Error syncing user deletion: {str(e)}")
        raise
