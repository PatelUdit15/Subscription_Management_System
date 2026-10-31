from pydantic import BaseModel, EmailStr

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
