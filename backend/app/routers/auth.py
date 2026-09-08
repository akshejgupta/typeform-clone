import hashlib
import hmac
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import AuthCredentials, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}${digest.hex()}"


def _check_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$", 1)
        expected = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
        return hmac.compare_digest(expected.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _to_user_out(user: User) -> UserOut:
    return UserOut(name=user.full_name, email=user.email, token=secrets.token_urlsafe(32))


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: AuthCredentials, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    full_name = (body.full_name or "").strip()
    if not full_name:
        raise HTTPException(status_code=422, detail="Full name is required.")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(email=email, full_name=full_name, password_hash=_hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_user_out(user)


@router.post("/login", response_model=UserOut)
def login(body: AuthCredentials, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not _check_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return _to_user_out(user)