from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "portal"  # Default to customer/portal role

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    email: str
    expires_in_minutes: int = 10
    otp_sent: bool = True
    dev_otp: Optional[str] = None  # Available if SMTP is in dev/unconfigured mode

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class VerifyOTPResponse(BaseModel):
    message: str
    valid: bool

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
