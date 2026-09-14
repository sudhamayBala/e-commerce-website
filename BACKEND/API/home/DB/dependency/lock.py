from fastapi import (Header, HTTPException)


def Verify_Password(input_password: str = Header(...) ):
    if input_password != USER_PASSWORD:
        raise HTTPException(status_code=401,detail="INvalid password")
    





