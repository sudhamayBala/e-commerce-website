from decimal import Decimal
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from API.home.DB.MODELS.Table.order import Order, OrderStatus
from API.home.DB.MODELS.Table.order_item import OrderItem
from API.home.DB.MODELS.Table.product import Product
from API.home.DB.MODELS.Table.user import User
from API.home.DB.session import get_db

order_router = APIRouter(prefix="/orders", tags=["orders"])


def serialize_products(order_items: List[OrderItem]) -> List[Dict[str, Any]]:
    payload: List[Dict[str, Any]] = []
    for item in order_items:
        product = item.product
        unit_price = getattr(item, "unit_price", None)
        item_price = float(unit_price) if unit_price is not None else float(getattr(item, "price", 0) or 0)
        unit_cost_price = getattr(item, "unit_cost_price", None)
        unit_selling_price = getattr(item, "unit_selling_price", None)
        payload.append(
            {
                "productId": item.product_id,
                "id": item.product_id,
                "name": product.name if product else f"Product #{item.product_id}",
                "quantity": item.quantity,
                "price": item_price,
                "unitCostPrice": float(unit_cost_price) if unit_cost_price is not None else float(getattr(product, "cost_price", 0) or 0),
                "unitSellingPrice": float(unit_selling_price) if unit_selling_price is not None else float(getattr(product, "selling_price", 0) or item_price),
                "returnStatus": "Not returned",
                "returnReason": "",
            }
        )
    return payload


def serialize_order(order: Order, order_items: List[OrderItem]) -> Dict[str, Any]:
    status_value = order.status.value if hasattr(order.status, "value") else str(order.status)
    return {
        "id": f"SN-{order.id or 0:04d}",
        "customer": order.customer_name or "Guest",
        "customer_name": order.customer_name or "Guest",
        "items": sum(item.quantity for item in order_items),
        "total": float(order.total_price),
        "amount": float(order.total_price),
        "status": "Preparing" if status_value in {"pending", "processing"} else status_value.title(),
        "rawStatus": status_value,
        "createdAt": order.created_at.isoformat() if order.created_at else None,
        "location": {
            "address": order.shipping_address or "",
            "city": "",
            "coordinates": None,
        },
        "products": serialize_products(order_items),
        "paymentMethod": order.payment_method or "card",
        "shipping_address": order.shipping_address or "",
    }


@order_router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_order(payload: dict, db: AsyncSession = Depends(get_db)):
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=400, detail="user_id is required.")

    customer_name = str(payload.get("customer_name") or "").strip()
    shipping_address = str(payload.get("shipping_address") or "").strip()
    if not customer_name:
        raise HTTPException(status_code=400, detail="Customer name is required.")
    if not shipping_address:
        raise HTTPException(status_code=400, detail="Shipping address is required.")

    user = await db.get(User, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please log in before placing an order.",
        )

    items = payload.get("items") or []
    if not items:
        raise HTTPException(status_code=400, detail="Order must contain at least one product.")

    total_price = Decimal(str(payload.get("total_price", 0)))
    order = Order(
        customer_name=customer_name or user.email,
        user_id=int(user_id),
        shipping_address=shipping_address or user.address or "",
        total_price=total_price,
        status=OrderStatus.PENDING,
        payment_method=payload.get("payment_method") or "card",
        payment_status=True,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    for entry in items:
        product_id = int(entry["product_id"])
        quantity = int(entry.get("quantity", 1))
        product = await db.get(Product, product_id)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product #{product_id} not found.")
        if product.stock_quantity < quantity:
            await db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {product.name}. Please reduce the quantity and try again.",
            )

        product.stock_quantity -= quantity
        order_item = OrderItem(
            order_id=order.id,
            product_id=product_id,
            quantity=quantity,
            unit_price=Decimal(str(product.selling_price if product.selling_price else product.price)),
            unit_cost_price=Decimal(str(product.cost_price or 0)),
            unit_selling_price=Decimal(str(product.selling_price if product.selling_price else product.price)),
            is_reviewed=False,
        )
        db.add(order_item)

    await db.commit()

    order_items = (
        await db.exec(
            select(OrderItem).options(selectinload(OrderItem.product)).where(OrderItem.order_id == order.id)
        )
    ).all()
    return serialize_order(order, order_items)


@order_router.get("", status_code=status.HTTP_200_OK)
async def get_orders(db: AsyncSession = Depends(get_db)):
    orders = (await db.exec(select(Order).order_by(Order.created_at.desc()))).all()
    response = []
    for order in orders:
        order_items = (
            await db.exec(
                select(OrderItem).options(selectinload(OrderItem.product)).where(OrderItem.order_id == order.id)
            )
        ).all()
        response.append(serialize_order(order, order_items))
    return response


@order_router.get("/{order_id}", status_code=status.HTTP_200_OK)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    items = (
        await db.exec(
            select(OrderItem).options(selectinload(OrderItem.product)).where(OrderItem.order_id == order.id)
        )
    ).all()
    return serialize_order(order, items)


@order_router.patch("/{order_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_order(order_id: int, payload: dict | None = None, db: AsyncSession = Depends(get_db)):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.status = OrderStatus.CANCELLED
    order.user_cancellation = True
    order_items = (
        await db.exec(
            select(OrderItem).options(selectinload(OrderItem.product)).where(OrderItem.order_id == order.id)
        )
    ).all()
    for item in order_items:
        product = await db.get(Product, item.product_id)
        if product is not None:
            product.stock_quantity += item.quantity

    await db.commit()
    return {"message": "Order cancelled successfully", "status": "cancelled"}


@order_router.patch("/{order_id}/status", status_code=status.HTTP_200_OK)
async def update_order_status(order_id: int, payload: dict, db: AsyncSession = Depends(get_db)):
    status_value = payload.get("status")
    allowed = {"pending", "processing", "shipped", "delivered", "cancelled"}
    if status_value not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported status: {status_value}")

    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.status = OrderStatus(status_value)
    await db.commit()
    return {"message": "Order status updated", "status": order.status.value}
