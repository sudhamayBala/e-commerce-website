from decimal import Decimal
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from API.home.DB.MODELS.Table.cart import Cart
from API.home.DB.MODELS.Table.cart_item import CartItem
from API.home.DB.MODELS.Table.product import Product
from API.home.DB.MODELS.Table.user import User
from API.home.DB.session import get_db

cart_router = APIRouter(prefix="/cart", tags=["cart"])


@cart_router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get_cart(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    cart = (await db.exec(select(Cart).where(Cart.user_id == user_id))).first()
    if cart is None:
        return {"user_id": user_id, "items": []}

    cart_items = (await db.exec(select(CartItem).where(CartItem.cart_id == cart.id))).all()
    serialized_items: List[Dict[str, Any]] = []
    for item in cart_items:
        product = await db.get(Product, item.product_id)
        serialized_items.append(
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "name": product.name if product else f"Product #{item.product_id}",
                "price": float(product.price) if product else 0,
            }
        )

    return {"user_id": user_id, "items": serialized_items}


@cart_router.put("/{user_id}", status_code=status.HTTP_200_OK)
async def save_cart(user_id: int, payload: dict, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    cart = (await db.exec(select(Cart).where(Cart.user_id == user_id))).first()
    if cart is None:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)

    existing_items = (await db.exec(select(CartItem).where(CartItem.cart_id == cart.id))).all()
    for item in existing_items:
        await db.delete(item)

    items = payload.get("items") or []
    for item in items:
        product_id = int(item["product_id"])
        quantity = int(item.get("quantity", 1))
        if quantity <= 0:
            continue

        product = await db.get(Product, product_id)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product #{product_id} not found")

        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity,
                unit_price=Decimal(str(product.price)),
            )
        )

    await db.commit()
    return {"user_id": user_id, "items": items}


@cart_router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def clear_cart(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    cart = (await db.exec(select(Cart).where(Cart.user_id == user_id))).first()
    if cart is None:
        return {"user_id": user_id, "items": []}

    cart_items = (await db.exec(select(CartItem).where(CartItem.cart_id == cart.id))).all()
    for item in cart_items:
        await db.delete(item)

    await db.commit()
    return {"user_id": user_id, "items": []}
