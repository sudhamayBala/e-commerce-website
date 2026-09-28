
from API.home.core.config import settings
from API.home.core.templete.exception import ApiException
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


ALGORITHM="HS256"
SECRET_KEY=settings.SECRETE_JWT_KEY
ACCESS_TOKEN_EXPIRE_DAYS=settings.ACCESS_TOKEN_EXPIRE_DAYS


if not SECRET_KEY :
    raise ApiException("SECRET_KEY and ACCESS_TOKEN_EXPIRE_DAYS are required")


def create_access_token(data: dict):
    from datetime import datetime, timedelta
    from jose import jwt

    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    from jose import jwt, JWTError
    from fastapi import HTTPException, status

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

bearer_scheme = HTTPBearer()


def get_access_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    return credentials.credentials