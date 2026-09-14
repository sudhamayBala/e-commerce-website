from builtins import ValueError, getattr, str

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from API.home.DB.session import get_db
from API.home.DB.MODELS.Table.cart import Cart
from API.home.DB.MODELS.Table.cart_item import CartItem
from API.home.DB.MODELS.Table.notification import Notification
from API.home.DB.MODELS.Table.order import Order
from API.home.DB.MODELS.Table.order_item import OrderItem
from API.home.DB.MODELS.Table.payment import Payment
from API.home.DB.MODELS.Table.review import Review
from API.home.DB.MODELS.schemas.ChangePassword import ChangePasswordSchema
from API.home.DB.MODELS.schemas.ForgotPasswordSchema import (
    ForgotPasswordSchema,
    ResetPasswordSchema,
)
from API.home.DB.MODELS.schemas.user import (
    LoginRequest,
    LoginResponse,
    UserCreate,
    UserPublic,
)
from API.home.DB.MODELS.Table.user import User
from API.home.core.templete.exception import ApiException
from API.home.core.templete.security import create_access_token
from service.user import (
    change_password as change_password_service,
    forget_password as forget_password_service,
    login_user as login_user_service,
    register_new_user,
    reset_password as reset_password_service,
)

auth_router = APIRouter(tags=["USER"])


class DeleteUserRequest(BaseModel):
    email: str


@auth_router.post(
    "/register",
    response_model=LoginResponse,
    status_code=201,
)
async def register(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await register_new_user(db, user_create)
        return LoginResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            access_token=create_access_token({"sub": str(user.id)}),
        )
    except (ApiException, ValueError) as e:
        raise HTTPException(
            status_code=getattr(e, "status_code", 400),
            detail=getattr(e, "message", str(e)),
        )


@auth_router.post(
    "/login",
    response_model=LoginResponse,
    status_code=200,
)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await login_user_service(db, login_data)
        return LoginResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            access_token=create_access_token({"sub": str(user.id)}),
        )
    except (ApiException, ValueError) as e:
        raise HTTPException(
            status_code=getattr(e, "status_code", 400),
            detail=getattr(e, "message", str(e)),
        )


@auth_router.post("/change-password")
async def change_password_endpoint(
    data: ChangePasswordSchema,
    db: AsyncSession = Depends(get_db),
):
    try:
        await change_password_service(
            db=db,
            email=data.email,
            old_password=data.old_password,
            new_password=data.new_password,
        )
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@auth_router.post("/reset-password")
async def reset_password_endpoint(
    data: ResetPasswordSchema,
    db: AsyncSession = Depends(get_db),
):
    try:
        await reset_password_service(
            db=db,
            email=data.email,
            code=data.code,
            new_password=data.new_password,
        )
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@auth_router.post("/forgot-password")
async def forgot_password_endpoint(
    data: ForgotPasswordSchema,
    db: AsyncSession = Depends(get_db),
):
    try:
        await forget_password_service(db=db, email=data.email)
        return {"message": "Password reset code sent successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@auth_router.delete("/delete-user")
async def delete_user(
    data: DeleteUserRequest,
    db: AsyncSession = Depends(get_db),
):
    statement = select(User).where(User.email == data.email)
    user = (await db.exec(statement)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Remove dependent rows first because their foreign keys are required.
    payments = (await db.exec(select(Payment).where(Payment.user_id == user.id))).all()
    for payment in payments:
        await db.delete(payment)

    orders = (await db.exec(select(Order).where(Order.user_id == user.id))).all()
    for order in orders:
        order_items = (
            await db.exec(select(OrderItem).where(OrderItem.order_id == order.id))
        ).all()
        for order_item in order_items:
            await db.delete(order_item)

        await db.delete(order)

    cart = (await db.exec(select(Cart).where(Cart.user_id == user.id))).first()
    if cart:
        cart_items = (
            await db.exec(select(CartItem).where(CartItem.cart_id == cart.id))
        ).all()
        for cart_item in cart_items:
            await db.delete(cart_item)
        await db.delete(cart)

    for model in (Notification, Review):
        dependent_rows = (
            await db.exec(select(model).where(model.user_id == user.id))
        ).all()
        for dependent_row in dependent_rows:
            await db.delete(dependent_row)

    await db.delete(user)
    await db.commit()

    return {"message": "User deleted successfully"}

@auth_router.post(
    "/logout",
    status_code=200,
)
async def logout(
    db: AsyncSession = Depends(get_db),
):
    return {"message": "Logged out successfully"}