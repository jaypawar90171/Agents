"""
Webhook routes for syncing Clerk data with MongoDB
Handles user.created, user.updated, and user.deleted events
"""
from fastapi import APIRouter, Request, HTTPException, status
from svix.webhooks import Webhook, WebhookVerificationError
import os
import logging
from app.services.user_service import sync_user_created, sync_user_updated, sync_user_deleted

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

# Get the signing secret from environment
CLERK_WEBHOOK_SIGNING_SECRET = os.getenv("CLERK_WEBHOOK_SIGNING_SECRET")

if not CLERK_WEBHOOK_SIGNING_SECRET:
    logger.warning("CLERK_WEBHOOK_SIGNING_SECRET not set in environment variables")


@router.post("/clerk")
async def handle_clerk_webhook(request: Request):
    """
    Webhook endpoint for Clerk events
    Verifies the webhook signature and processes the event
    
    Supported events:
    - user.created: Sync new user to database
    - user.updated: Update existing user in database
    - user.deleted: Delete user from database or mark as deleted
    """
    try:
        # Get the webhook payload and headers
        payload = await request.body()
        headers = dict(request.headers)
        
        # Verify the webhook signature
        wh = Webhook(CLERK_WEBHOOK_SIGNING_SECRET)
        evt = wh.verify(payload, headers)
        
        event_type = evt.get("type")
        data = evt.get("data", {})
        
        logger.info(f"Received webhook event: {event_type}")
        
        # Handle different event types
        if event_type == "user.created":
            await sync_user_created(data)
            logger.info(f"Successfully synced new user: {data.get('id')}")
            
        elif event_type == "user.updated":
            await sync_user_updated(data)
            logger.info(f"Successfully updated user: {data.get('id')}")
            
        elif event_type == "user.deleted":
            await sync_user_deleted(data)
            logger.info(f"Successfully deleted/marked user: {data.get('id')}")
        
        else:
            logger.info(f"Received unhandled webhook event type: {event_type}")
        
        # Return 200 to acknowledge receipt
        return {"status": "success", "message": "Webhook received"}
    
    except WebhookVerificationError as e:
        logger.error(f"Webhook verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Webhook verification failed"
        )
    
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        # Return 400 to indicate error and potentially retry
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing webhook: {str(e)}"
        )
