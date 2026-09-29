import os
from typing import Any, Dict, List, Optional

import stripe
from fastapi import APIRouter, HTTPException
from API.home.core.config import settings


payment_router = APIRouter(prefix="/payment", tags=["payment"])
FRONTEND_URL = settings.FRONTEND_URL.rstrip("/")


def create_checkout_session(
    items: List[Dict[str, Any]],
    customer_email: str = "",
    success_url: str = f"{FRONTEND_URL}/home",
    cancel_url: str = f"{FRONTEND_URL}/cart",
    stripe_secret_key: Optional[str] = None,
) -> Dict[str, Any]:
    if not items:
        raise ValueError("At least one cart item is required to create a checkout session.")

    amount_total = round(
        sum(float(item.get("price", 0)) * int(item.get("quantity", 1)) for item in items),
        2,
    )

    stripe_key = (stripe_secret_key or os.getenv("STRIPE_SECRET_KEY") or "").strip()

    if stripe_key:
        stripe.api_key = stripe_key
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="payment",
                customer_email=customer_email or None,
                line_items=[
                    {
                        "price_data": {
                            "currency": "inr",
                            "product_data": {"name": item.get("name", "Product")},
                            "unit_amount": max(1, int(float(item.get("price", 0)) * 100)),
                        },
                        "quantity": int(item.get("quantity", 1)),
                    }
                    for item in items
                ],
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return {
                "provider": "stripe",
                "checkout_url": session.url,
                "session_id": session.id,
                "amount_total": amount_total,
            }
        except Exception:
            pass

    demo_checkout_url = (
        f"{success_url}?demo_checkout=1&amount_total={amount_total}"
        f"&customer_email={customer_email or 'guest'}"
    )

    return {
        "provider": "demo",
        "checkout_url": demo_checkout_url,
        "session_id": "demo-session",
        "amount_total": amount_total,
    }


@payment_router.post("/create-checkout-session")
async def create_checkout_session_endpoint(payload: dict):
    try:
        items = payload.get("items", [])
        customer_email = payload.get("customer_email", "")
        success_url = payload.get("success_url", f"{FRONTEND_URL}/home")
        cancel_url = payload.get("cancel_url", f"{FRONTEND_URL}/cart")
        stripe_secret_key = payload.get("stripe_secret_key")

        if not items:
            raise HTTPException(status_code=400, detail="Cart is empty.")

        summary = create_checkout_session(
            items=items,
            customer_email=customer_email,
            success_url=success_url,
            cancel_url=cancel_url,
            stripe_secret_key=stripe_secret_key,
        )
        return summary
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
