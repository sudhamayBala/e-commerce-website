from builtins import Exception, ValueError, classmethod, int, str

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from API.home.DB.MODELS.Table.product import Product
from API.home.DB.MODELS.Table.review import Review
from API.home.DB.MODELS.Table.user import User
from API.home.DB.session import get_db


Review_rout = APIRouter(
    prefix="/rating",
    tags=["Customer Rating"],
)


class ReviewCreate(BaseModel):
    product_id: int = Field(gt=0)
    user_id: int = Field(gt=0)
    rating: int = Field(ge=1, le=6)
    comment: str = Field(min_length=1, max_length=2000)

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Comment cannot be empty")

        return value

@Review_rout.post("/review/post", status_code=status.HTTP_201_CREATED)
async def post_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    product = await db.get(Product, review_data.product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    user = await db.get(User, review_data.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    review = Review(
        product_id=review_data.product_id,
        user_id=review_data.user_id,
        username=user.email,
        rating=review_data.rating,
        comment=review_data.comment,
    )

    try:
        db.add(review)
        await db.commit()
        await db.refresh(review)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save review",
        )

    return {
        "id": review.id,
        "product_id": review.product_id,
        "user_id": review.user_id,
        "username": review.username,
        "rating": review.rating,
        "comment": review.comment,
        "date": review.created_at,
    }

@Review_rout.get("/reviews/get")
async def get_reviews(db: AsyncSession = Depends(get_db)):
    result = await db.exec(
        select(Review).order_by(Review.created_at.desc())
    )
    reviews = result.all()

    return [
        {
            "id": review.id,
            "product_id": review.product_id,
            "user_id": review.user_id,
            "username": review.username,
            "rating": review.rating,
            "comment": review.comment,
            "date": review.created_at,
        }
        for review in reviews
    ]



@Review_rout.get("/review/get/{review_id}", status_code=status.HTTP_200_OK)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
):
    review = await db.get(Review, review_id)
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    return {
        "id": review.id,
        "product_id": review.product_id,
        "user_id": review.user_id,
        "username": review.username,
        "rating": review.rating,
        "comment": review.comment,
        "date": review.created_at,
    }



@Review_rout.put("/review/update/{review_id}",status_code=status.HTTP_200_OK)
async def update_review(
        review_id:int,
        review_data:ReviewCreate,
        db: AsyncSession = Depends(get_db)
    ):
        review=await db.get(Review,review_id)
        if review is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        product=await db.get(Product,review_data.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        user=await db.get(User,review_data.user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        review.product_id=review_data.product_id
        review.user_id=review_data.user_id
        review.rating=review_data.rating
        review.comment=review_data.comment

        try:
            db.add(review)
            await db.commit()
            await db.refresh(review)
        except Exception:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to update review",
            )
        return {
            "id": review.id,
            "product_id": review.product_id,
            "user_id": review.user_id,
            "username": review.username,
            "rating": review.rating,
            "comment": review.comment,
            "date": review.created_at,
        }