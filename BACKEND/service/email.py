from pathlib import Path
from API.home.core.config import settings
from jinja2 import Environment, FileSystemLoader

TEMPLATE_DIR=Path(__file__).resolve().parent.parent/"templates"
jinja_env=Environment(loader=FileSystemLoader(TEMPLATE_DIR))

async def send_welcome_email(email:str,name:str):
    print("Inside send_welcome_email")

    print(f"Mail_User: (settings.MAIL_USER)")

    message=EmailMassage()
    message["subject"]="Welcome"

    message['to']=email
    try:
        template=jinja_env
        html_content= template.render(name=name,frontendUrl=settings.FRONTEND_URL)
        message.add_alternative(html_content,subtype='html')
    except Exception as e:
        message.set_content("Hellow {name}, Welcome")
        print(f"🌋 Templete Error: {e}")

    try: 
        await aiosmtplib.send(
            massage,
            hostname=settings.MAIL_HOST,
            port=int(settings.MAIL_PORT),
            username=settings.MAIL_USER,
            password=settings.MAIL_PASSWORD

        )
        print("The Email send Successfully")
    except:
        print(f"Error sending welcome email out:{e}")


                          

from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from fastapi import HTTPException
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr


                                                           
                        
                                                           

BASE_DIR = Path(__file__).resolve().parent.parent

TEMPLATE_DIR = BASE_DIR / "templates"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR))
)


                                                           
                     
                                                           

conf = ConnectionConfig(
    MAIL_USERNAME="your_email@gmail.com",
    MAIL_PASSWORD="your_app_password",
    MAIL_FROM="your_email@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


                                                           
                       
                                                           

def render_email(template_name: str, **context) -> str:
    """
    Load a Jinja2 HTML template and render it
    using the supplied context.
    """

    try:
        template = env.get_template(template_name)
        return template.render(**context)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Email template error: {str(e)}"
        )


                                                           
            
                                                           

async def send_email(
    recipient: EmailStr,
    subject: str,
    template_name: str,
    **context
):
    """
    Render an HTML email template and send the email.
    """

    html_content = render_email(
        template_name,
        **context
    )

    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
        body=html_content,
        subtype="html",
    )

    fast_mail = FastMail(conf)

    await fast_mail.send_message(message)

    return {
        "message": "Email sent successfully"
    }


                                                           
                    
                                                           

def get_email_datetime():
    """
    Get formatted datetime for email templates
    """
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")