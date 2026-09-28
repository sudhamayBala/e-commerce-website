from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from API.home.DB.MODELS.Table.category import Category
from API.home.DB.session import get_db
from API.home.DB.MODELS.schemas import category as category_schema


category_router = APIRouter(
    prefix="/category",
    tags=["categories"]
)


@category_router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: category_schema.CategoryCreate,
    session: AsyncSession = Depends(get_db)
) -> category_schema.CategoryRead:
                                                               
    existing = await session.exec(select(Category).where(Category.name == category_data.name))
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )

    db_category = Category(**category_data.model_dump())

    try:
        session.add(db_category)
        await session.commit()
        await session.refresh(db_category)
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to create category: {str(e)}"
        )
    return db_category


@category_router.get("/Gate/Categories", status_code=status.HTTP_200_OK)
async def get_category_list(
    db: AsyncSession = Depends(get_db)
) -> List[category_schema.CategoryRead]:
    result = await db.exec(select(Category))
    return result.all()


@category_router.get("/Get/Category/{category_id}", status_code=status.HTTP_200_OK)
async def get_category(
    category_id: int,
    session: AsyncSession = Depends(get_db)
) -> category_schema.CategoryRead:
    db_category = await session.get(Category, category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )
    return db_category


@category_router.put("/update/{category_id}", status_code=status.HTTP_200_OK)
async def update_category(
    category_id: int,
    category_data: category_schema.CategoryUpdate,
    db: AsyncSession = Depends(get_db)
) -> category_schema.CategoryRead:
    db_category = await db.get(Category, category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )

    for key, value in category_data.model_dump(exclude_unset=True).items():
        setattr(db_category, key, value)

    try:
        db.add(db_category)
        await db.commit()
        await db.refresh(db_category)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to update category: {str(e)}"
        )

    return db_category