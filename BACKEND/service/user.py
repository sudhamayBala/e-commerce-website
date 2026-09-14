import secrets
import string
from builtins import bool, print, range, str, TypeError, ValueError
from datetime import datetime, timezone

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from passlib.context import CryptContext

from API.home.DB.MODELS.Table.user import User, UserRole
from API.home.DB.MODELS.schemas.user import UserCreate, LoginRequest
from API.home.DB.MODELS.Table.reset_code import ResetCodeModel


# ============================================================
# REGISTER USER
# ============================================================

async def register_new_user(
    db: AsyncSession,
    user_create: UserCreate
) -> User:
    """
    Register a new user.
    """

    # 1. Check whether email already exists
    statement = select(User).where(
        User.email == user_create.email
    )

    existing_user = (await db.exec(statement)).first()

    if existing_user:
        raise ValueError("Email already registered")

    # 2. Create user
    new_user = User(
        email=user_create.email,
        hashed_password=hash_password(user_create.password),
        role=UserRole(user_create.role.value),
        active=True,
    )

    # 3. Save user
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


# ============================================================
# LOGIN USER
# ============================================================

async def login_user(
    db: AsyncSession,
    login_data: LoginRequest
) -> User:
    """
    Login user using email and password.
    """

    # 1. Find user by email
    statement = select(User).where(
        User.email == login_data.email
    )

    user = (await db.exec(statement)).first()

    # 2. Check user
    if not user:
        raise ValueError("Invalid email or password")

    # 3. Check account status
    if not user.active:
        raise ValueError("User account is inactive")

    # 4. Check password
    if not verify_password(login_data.password, user.hashed_password):
        raise ValueError("Invalid email or password")

    # Upgrade accounts created before password hashing was introduced.
    if not user.hashed_password.startswith("$2"):
        user.hashed_password = hash_password(login_data.password)
        db.add(user)
        await db.commit()

    return user


# ============================================================
# FORGOT PASSWORD
# ============================================================



async def forget_password(
    db: AsyncSession,
    email: str
) -> User:
    """
    Generate a unique 6-digit password reset code.
    """

    # 1. Find user
    statement = select(User).where(
        User.email == email
    )

    user = (await db.exec(statement)).first()

    if not user:
        raise ValueError("Email not found")

    # 2. Generate unique 6-digit reset code
    while True:

        code = ''.join(
            secrets.choice(string.digits)
            for _ in range(6)
        )

        code_statement = select(
            ResetCodeModel
        ).where(
            ResetCodeModel.code == code
        )

        existing_code = (
            await db.exec(code_statement)
        ).first()

        if not existing_code:
            break

    # 3. Save reset code
    existing_reset = (await db.exec(
        select(ResetCodeModel).where(ResetCodeModel.email == user.email)
    )).first()
    if existing_reset:
        await db.delete(existing_reset)

    reset_code = ResetCodeModel(email=user.email, code=code)

    db.add(reset_code)

    await db.commit()

    await db.refresh(reset_code)

    # 4. Send email
    # await send_reset_email(user.email, code)

    print(f"Password reset code: {code}")

    return user


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return plain_password == hashed_password


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


async def change_password(
    db: AsyncSession,
    email: str,
    old_password: str,
    new_password: str
) -> User:
    """
    Change the user's password using the old password.
    """

    # 1. Find user
    statement = select(User).where(
        User.email == email
    )

    user = (await db.exec(statement)).first()

    if not user:
        raise ValueError("Email not found")

    # 2. Verify old password
    if not verify_password(
        old_password,
        user.hashed_password
    ):
        raise ValueError("Old password is incorrect")

    # 3. Check new password
    if old_password == new_password:
        raise ValueError(
            "New password must be different from old password"
        )

    # 4. Hash new password
    user.hashed_password = hash_password(new_password)

    # 5. Save changes
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


async def reset_password(
    db: AsyncSession,
    email: str,
    code: str,
    new_password: str,
) -> User:
    """Reset a password using a valid, unexpired, single-use code."""
    user = (await db.exec(
        select(User).where(User.email == email)
    )).first()
    if not user:
        raise ValueError("Invalid reset code")

    reset_code = (await db.exec(
        select(ResetCodeModel).where(
            ResetCodeModel.email == email,
            ResetCodeModel.code == code,
        )
    )).first()
    if not reset_code:
        raise ValueError("Invalid reset code")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if reset_code.expires_at <= now:
        await db.delete(reset_code)
        await db.commit()
        raise ValueError("Reset code has expired")

    user.hashed_password = hash_password(new_password)
    await db.delete(reset_code)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user