from contextlib import asynccontextmanager
from builtins import Exception, print, str
from API.auth.auth import auth_router as auth_router
import stripe
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import text

from API.home.core.config import settings
from API.home.core.templete.exception import ApiException, api_exception_handler
from API.home.Routers  import api_router
from API.home.DB.session import engine
from router.productRouter.ratingRout import Review_rout

#from API.auth.auth import auth_router

# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Application starting...")

    try:
        # Test database connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))

        print("Successfully connected to the database.")

    except Exception as e:
        print(f"Database connection failed: {e}")
        raise

    yield

    print("Application shutting down...")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Online Shopping API",
    description="Backend API for Online Shopping Application",
    version="1.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:9433",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:9433",
        "http://localhost:4173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# CUSTOM API EXCEPTION
# ============================================================

app.add_exception_handler(
    ApiException,
    api_exception_handler,
)


# ============================================================
# STRIPE EXCEPTION HANDLER
# ============================================================

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


# ============================================================
# GENERAL EXCEPTION HANDLER
# ============================================================

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


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
async def root():

    return {
        "message": "Online Shopping API is running successfully 🚀",
        "status": "success",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check():

    return {
        "status": "healthy",
        "database": "connected",
    }


# ============================================================
# INCLUDE API ROUTER
# ============================================================

app.include_router(api_router)
app.include_router(auth_router, prefix="/auth")
app.include_router(Review_rout)
# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "API.home.main:app",
        host="127.0.0.1",
        port=2026,
        reload=True,
    )
