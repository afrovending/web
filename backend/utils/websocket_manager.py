"""
WebSocket connection manager for real-time messaging
"""
from fastapi import WebSocket
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time messaging"""
    
    def __init__(self):
        # Map user_id to set of active WebSocket connections
        # A user can have multiple connections (multiple tabs/devices)
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Clean up empty sets
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    def is_online(self, user_id: str) -> bool:
        """Check if a user has any active connections"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to all connections of a specific user"""
        if user_id in self.active_connections:
            disconnected = []
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up failed connections
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def send_to_conversation(self, message: dict, participant_ids: list):
        """Send a message to all participants in a conversation"""
        for user_id in participant_ids:
            await self.send_personal_message(message, user_id)
    
    async def broadcast_typing(self, conversation_id: str, user_id: str, user_name: str, participant_ids: list, is_typing: bool):
        """Broadcast typing indicator to conversation participants"""
        message = {
            "type": "typing",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "user_name": user_name,
            "is_typing": is_typing
        }
        
        # Send to all participants except the one typing
        for participant_id in participant_ids:
            if participant_id != user_id:
                await self.send_personal_message(message, participant_id)
    
    async def broadcast_online_status(self, user_id: str, is_online: bool, contact_ids: list):
        """Broadcast online status to contacts"""
        message = {
            "type": "status",
            "user_id": user_id,
            "is_online": is_online
        }
        
        for contact_id in contact_ids:
            await self.send_personal_message(message, contact_id)
    
    def get_online_users(self, user_ids: list) -> list:
        """Get list of online users from given list of user IDs"""
        return [uid for uid in user_ids if self.is_online(uid)]


# Global connection manager instance
manager = ConnectionManager()
