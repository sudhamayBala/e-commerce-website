import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from API.home.DB.MODELS.Table.product import Product
from API.home.DB.MODELS.Table.category import Category
from API.home.DB.MODELS.Table.cart_item import CartItem
from API.home.DB.MODELS.Table.order_item import OrderItem
from API.home.DB.MODELS.Table.review import Review
from API.home.DB.session import get_db
from API.home.DB.MODELS.schemas import product as product_schema

product_router = APIRouter(
    prefix="/product",
    tags=["products"]
)

                                            
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def product_response(product: Product):
    selling_price = product.selling_price if product.selling_price is not None else product.price
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "cost_price": product.cost_price,
        "selling_price": selling_price,
        "stock_quantity": product.stock_quantity,
        "image_url": product.image_url,
        "category_id": product.category_id,
        "created_at": product.created_at,
    }


@product_router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: Decimal = Form(None),
    selling_price: Optional[Decimal] = Form(None),
    cost_price: Optional[Decimal] = Form(None),
    stock_quantity: int = Form(...),
    category_id: int = Form(...),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db)
):
    resolved_price = selling_price if selling_price is not None else price
    if resolved_price is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Product selling price is required."
        )
    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )

    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Product image file is required."
        )

    existing_product = await session.exec(
        select(Product).where(Product.name == name.strip())
    )
    if existing_product.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product named '{name}' already exists. Choose a different name."
        )
    
                                                            
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image file: {str(e)}"
        )

    db_product = Product(
        name=name.strip(),
        description=description,
        price=float(resolved_price),
        selling_price=float(resolved_price),
        cost_price=float(cost_price or 0),
        stock_quantity=stock_quantity,
        category_id=category_id,
        image_url=unique_filename
    )

    try:
        session.add(db_product)
        await session.commit()
        await session.refresh(db_product)
    except Exception as e:
        await session.rollback()
                                              
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to create product: {str(e)}"
        )
    return product_response(db_product)


@product_router.get("/Gate/Products", status_code=status.HTTP_200_OK)
async def get_product_list(
    db: AsyncSession = Depends(get_db)
) -> List[dict]:
    result = await db.exec(select(Product).options(selectinload(Product.category)))
    products = result.all()
    return [
        {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "cost_price": product.cost_price,
            "selling_price": product.selling_price if product.selling_price else product.price,
            "stock_quantity": product.stock_quantity,
            "category_id": product.category_id,
            "image_url": product.image_url,
            "category": product.category.name if product.category else None,
        }
        for product in products
    ]


@product_router.get("/Get/Product/{product_id}", status_code=status.HTTP_200_OK)
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_db)
) -> dict:
    db_product = await session.get(Product, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    return product_response(db_product)


@product_router.put("/update/{product_id}", status_code=status.HTTP_200_OK)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[Decimal] = Form(None),
    selling_price: Optional[Decimal] = Form(None),
    cost_price: Optional[Decimal] = Form(None),
    stock_quantity: Optional[int] = Form(None),
    category_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
) -> dict:
    db_product = await db.get(Product, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    if category_id is not None:
        category = await db.get(Category, category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with id {category_id} not found"
            )
        db_product.category_id = category_id

    if name is not None:
        existing_product = await db.exec(
            select(Product).where(
                Product.name == name.strip(),
                Product.id != product_id,
            )
        )
        if existing_product.first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product named '{name}' already exists. Choose a different name."
            )
        db_product.name = name.strip()

    if description is not None:
        db_product.description = description

    resolved_selling_price = selling_price if selling_price is not None else price
    if resolved_selling_price is not None:
        db_product.price = float(resolved_selling_price)
        db_product.selling_price = float(resolved_selling_price)
    if cost_price is not None:
        db_product.cost_price = float(cost_price)
    if stock_quantity is not None:
        db_product.stock_quantity = stock_quantity

                                            
    if file and file.filename:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
                                          
            if db_product.image_url:
                old_file_path = UPLOAD_DIR / db_product.image_url
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)

            db_product.image_url = unique_filename
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save new image file: {str(e)}"
            )

    try:
        db.add(db_product)
        await db.commit()
        await db.refresh(db_product)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to update product: {str(e)}"
        )

    return product_response(db_product)


@product_router.delete("/delete/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    db_product = await db.get(Product, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    try:
        for model in (Review, CartItem, OrderItem):
            dependent_rows = (
                await db.exec(select(model).where(model.product_id == product_id))
            ).all()
            for row in dependent_rows:
                await db.delete(row)

                                                 
        if db_product.image_url:
            file_path = os.path.join(UPLOAD_DIR, db_product.image_url)
            if os.path.exists(file_path):
                os.remove(file_path)

        await db.delete(db_product)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to delete product: {str(e)}",
        )

    return None