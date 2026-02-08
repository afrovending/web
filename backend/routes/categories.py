"""
Category routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid

from config import db
from utils.auth import require_admin
from models import CategoryCreate, CategoryResponse

router = APIRouter(tags=["Categories"])

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """Get all categories"""
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, user: dict = Depends(require_admin)):
    """Create a new category (admin only)"""
    cat_id = str(uuid.uuid4())
    cat_doc = {
        "id": cat_id,
        **category.model_dump()
    }
    await db.categories.insert_one(cat_doc)
    return CategoryResponse(id=cat_id, **category.model_dump())

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(require_admin)):
    """Delete a category (admin only)"""
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}
