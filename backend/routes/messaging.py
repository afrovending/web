"""
Messaging routes for Afrovending API
Customer-Vendor chat system with WebSocket support
"""
from fastapi import APIRouter, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid
import json

from config import db, logger
from utils.auth import get_current_user
from utils.websocket_manager import manager

router = APIRouter(tags=["Messaging"])


# ==================== MODELS ====================

class MessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    recipient_id: str
    content: str = Field(..., min_length=1, max_length=2000)
    product_id: Optional[str] = None  # Optional: for product-related inquiries

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_role: str  # 'customer' or 'vendor'
    recipient_id: str
    content: str
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    read: bool = False
    created_at: str

class ConversationResponse(BaseModel):
    id: str
    participants: List[dict]  # [{id, name, role}]
    last_message: Optional[dict] = None
    unread_count: int = 0
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    created_at: str
    updated_at: str


# ==================== HELPER FUNCTIONS ====================

async def get_or_create_conversation(user_id: str, recipient_id: str, product_id: Optional[str] = None):
    """Get existing conversation or create new one"""
    # Look for existing conversation between these users
    query = {
        "$and": [
            {"participant_ids": {"$all": [user_id, recipient_id]}},
        ]
    }
    
    # If product_id is provided, include it in the search
    if product_id:
        query["$and"].append({"product_id": product_id})
    else:
        query["$and"].append({"$or": [{"product_id": None}, {"product_id": {"$exists": False}}]})
    
    conversation = await db.conversations.find_one(query, {"_id": 0})
    
    if conversation:
        return conversation
    
    # Get user info for participants
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "role": 1})
    recipient = await db.users.find_one({"id": recipient_id}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "role": 1})
    
    if not user or not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get product info if applicable
    product_info = None
    if product_id:
        product = await db.products.find_one({"id": product_id}, {"_id": 0, "id": 1, "name": 1, "images": 1})
        if product:
            product_info = {
                "id": product["id"],
                "name": product["name"],
                "image": product.get("images", [None])[0]
            }
    
    # Create new conversation
    now = datetime.now(timezone.utc).isoformat()
    conversation = {
        "id": str(uuid.uuid4()),
        "participant_ids": [user_id, recipient_id],
        "participants": [
            {"id": user["id"], "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "User", "role": user.get("role", "customer")},
            {"id": recipient["id"], "name": f"{recipient.get('first_name', '')} {recipient.get('last_name', '')}".strip() or "User", "role": recipient.get("role", "customer")}
        ],
        "product_id": product_info["id"] if product_info else None,
        "product_name": product_info["name"] if product_info else None,
        "product_image": product_info["image"] if product_info else None,
        "last_message": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.conversations.insert_one(conversation)
    conversation.pop("_id", None)
    
    return conversation


# ==================== ROUTES ====================

@router.get("/messages/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20
):
    """Get all conversations for the current user"""
    # Get conversations where user is a participant
    cursor = db.conversations.find(
        {"participant_ids": user["id"]},
        {"_id": 0}
    ).sort("updated_at", -1).skip(skip).limit(limit)
    
    conversations = await cursor.to_list(length=limit)
    
    # Calculate unread count for each conversation
    for conv in conversations:
        unread = await db.messages.count_documents({
            "conversation_id": conv["id"],
            "recipient_id": user["id"],
            "read": False
        })
        conv["unread_count"] = unread
    
    return conversations


@router.get("/messages/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a specific conversation"""
    conversation = await db.conversations.find_one(
        {"id": conversation_id, "participant_ids": user["id"]},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Calculate unread count
    unread = await db.messages.count_documents({
        "conversation_id": conversation_id,
        "recipient_id": user["id"],
        "read": False
    })
    conversation["unread_count"] = unread
    
    return conversation


@router.get("/messages/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    before: Optional[str] = None  # For pagination by timestamp
):
    """Get messages in a conversation"""
    # Verify user is part of conversation
    conversation = await db.conversations.find_one(
        {"id": conversation_id, "participant_ids": user["id"]},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    query = {"conversation_id": conversation_id}
    if before:
        query["created_at"] = {"$lt": before}
    
    cursor = db.messages.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    messages = await cursor.to_list(length=limit)
    
    # Mark messages as read
    await db.messages.update_many(
        {
            "conversation_id": conversation_id,
            "recipient_id": user["id"],
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    return messages[::-1]  # Return in chronological order


@router.post("/messages/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    user: dict = Depends(get_current_user)
):
    """Send a message to another user"""
    # Cannot message yourself
    if message.recipient_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    
    # Get or create conversation
    if message.conversation_id:
        conversation = await db.conversations.find_one(
            {"id": message.conversation_id, "participant_ids": user["id"]},
            {"_id": 0}
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = await get_or_create_conversation(
            user["id"], 
            message.recipient_id,
            message.product_id
        )
    
    # Get product name if product_id is provided
    product_name = None
    if message.product_id:
        product = await db.products.find_one({"id": message.product_id}, {"_id": 0, "name": 1})
        product_name = product["name"] if product else None
    
    # Create message
    now = datetime.now(timezone.utc).isoformat()
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "User"
    
    new_message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation["id"],
        "sender_id": user["id"],
        "sender_name": user_name,
        "sender_role": user.get("role", "customer"),
        "recipient_id": message.recipient_id,
        "content": message.content,
        "product_id": message.product_id,
        "product_name": product_name,
        "read": False,
        "created_at": now
    }
    
    await db.messages.insert_one(new_message)
    new_message.pop("_id", None)
    
    # Update conversation's last message and timestamp
    await db.conversations.update_one(
        {"id": conversation["id"]},
        {
            "$set": {
                "last_message": {
                    "content": message.content[:100],
                    "sender_id": user["id"],
                    "sender_name": user_name,
                    "created_at": now
                },
                "updated_at": now
            }
        }
    )
    
    logger.info(f"Message sent from {user['id']} to {message.recipient_id}")
    return new_message


@router.get("/messages/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get total unread message count for current user"""
    count = await db.messages.count_documents({
        "recipient_id": user["id"],
        "read": False
    })
    return {"unread_count": count}


@router.put("/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    user: dict = Depends(get_current_user)
):
    """Mark a specific message as read"""
    result = await db.messages.update_one(
        {"id": message_id, "recipient_id": user["id"]},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Message marked as read"}


@router.delete("/messages/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a conversation (soft delete - just removes user from participants)"""
    # For now, we'll do a hard delete of the conversation and its messages
    # In production, you might want to implement soft delete
    
    conversation = await db.conversations.find_one(
        {"id": conversation_id, "participant_ids": user["id"]},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete messages
    await db.messages.delete_many({"conversation_id": conversation_id})
    
    # Delete conversation
    await db.conversations.delete_one({"id": conversation_id})
    
    logger.info(f"Conversation {conversation_id} deleted by user {user['id']}")
    return {"message": "Conversation deleted"}


@router.get("/messages/vendor/{vendor_id}/start")
async def start_vendor_conversation(
    vendor_id: str,
    product_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Start or get existing conversation with a vendor"""
    # Get vendor's user_id
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0, "user_id": 1})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    recipient_id = vendor["user_id"]
    
    if recipient_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot start conversation with yourself")
    
    conversation = await get_or_create_conversation(user["id"], recipient_id, product_id)
    
    return conversation
