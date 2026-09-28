from fastapi import (APIRouter ,Depends)
from service.email import (
    render_email,
    get_email_datetime,
)
from API.home.DB.MODELS.schemas.ChangePassword import ChangePasswordSchema
from service.user import change_password


                                                                                          
api_router=APIRouter(prefix="/api",tags=["API"])
@api_router.get("/face_order",tags=["API_ROUTER"])
async def health_check():
    return {"massage":"The api  is working"}

@api_router.get ("h1")
async def say_hi ():
    return {"Hello":"I am saying Hi"}




@api_router.post("/create_order")
async def create_order():

                                        
                 

    context = {
        "username": "Sudhamay",
        "store_name": "My E-Commerce",

        "order_id": "ORD-10025",
        "total_amount": "1499.00",
        "payment_method": "UPI",

        **get_email_datetime(),

        "order_url": "https://example.com/orders/ORD-10025",
        "website_url": "https://example.com",
        "support_url": "https://example.com/support",
    }

    html_content = render_email(
        "order_confirmation.html",
        context
    )

            
                                                  

    return {
        "message": "Order created successfully"
    }



