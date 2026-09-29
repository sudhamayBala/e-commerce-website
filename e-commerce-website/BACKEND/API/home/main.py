from contextlib import asynccontextmanager
from builtins import Exception, print, str
from API.auth.auth import auth_router as auth_router
import stripe
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles                                 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import text

from API.home.core.config import settings
from API.home.core.templete.exception import ApiException, api_exception_handler
from API.home.Routers  import api_router
from API.home.DB.session import engine
from API.home.payment import payment_router
from API.home.orders import order_router
from API.home.cart import cart_router
from router.productRouter.product_rout import product_router
from router.productRouter.ratingRout import Review_rout
from router.productRouter.category import category_router
                                      


@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Application starting...")

    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.execute(text("""
                ALTER TABLE IF EXISTS orders
                ADD COLUMN IF NOT EXISTS customer_name VARCHAR,
                ADD COLUMN IF NOT EXISTS customer_id VARCHAR,
                ADD COLUMN IF NOT EXISTS product_type VARCHAR,
                ADD COLUMN IF NOT EXISTS user_cancellation BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS payment_status BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS payment_method VARCHAR,
                ADD COLUMN IF NOT EXISTS refunded BOOLEAN DEFAULT FALSE;
            """))
            await conn.execute(text("""
                ALTER TABLE IF EXISTS order_items
                ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS unit_cost_price NUMERIC(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS unit_selling_price NUMERIC(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN DEFAULT FALSE;
            """))
            await conn.execute(text("""
                ALTER TABLE IF EXISTS carts
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
            """))
            await conn.execute(text("""
                UPDATE carts
                SET created_at = NOW()
                WHERE created_at IS NULL;
            """))
            await conn.execute(text("""
                ALTER TABLE IF EXISTS carts
                ALTER COLUMN created_at SET DEFAULT NOW();
            """))
            await conn.execute(text("""
                ALTER TABLE IF EXISTS cart_items
                ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2) DEFAULT 0;
            """))
            await conn.execute(text("""
                UPDATE cart_items
                SET unit_price = 0
                WHERE unit_price IS NULL;
            """))
            await conn.execute(text("""
                ALTER TABLE IF EXISTS reviews
                ADD COLUMN IF NOT EXISTS username VARCHAR,
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
            """))
            await conn.execute(text("""
                ALTER TABLE IF EXISTS products
                ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2) DEFAULT 0;
            """))
            await conn.execute(text("""
                UPDATE products
                SET selling_price = price
                WHERE selling_price IS NULL OR selling_price = 0;
            """))
            await conn.execute(text("""
                UPDATE products
                SET cost_price = 0
                WHERE cost_price IS NULL;
            """))

        print("Successfully connected to the database.")

    except Exception as e:
        print(f"Database connection failed: {e}")
        raise

    yield

    print("Application shutting down...")



app = FastAPI(
    title="Online Shopping API",
    description="Backend API for Online Shopping Application",
    version="1.0.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        settings.FRONTEND_URL,
        "https://e-commerce-website-od8p.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)



app.add_exception_handler(
    ApiException,
    api_exception_handler,
)



@app.exception_handler(stripe.error.StripeError)
async def stripe_exception_handler(
    request: Request,
    exc: stripe.error.StripeError,
):

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Stripe payment error",
            "message": str(exc),
        },
    )




@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception,
):

    print(f"Internal Server Error: {exc}")

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
        },
    )



@app.get("/")
async def root():

    return {
        "message": "Online Shopping API is running successfully 🚀",
        "status": "success",
    }



@app.get("/health")
async def health_check():

    return {
        "status": "healthy",
        "database": "connected",
    }



app.include_router(api_router)
app.include_router(auth_router, prefix="/auth")
app.include_router(payment_router)
app.include_router(order_router)
app.include_router(cart_router)
app.include_router(Review_rout)
app.include_router(product_router )
app.include_router(category_router)

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "API.home.main:app",
        host="127.0.0.1",
        port=2026,
        reload=True,
    )