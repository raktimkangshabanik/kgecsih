from fastapi import (
    APIRouter,
    HTTPException
)

from pydantic import (
    BaseModel,
    EmailStr
)

from pwdlib import PasswordHash

import jwt
import os

from database.connection import get_connection


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =====================================================
# PASSWORD HASHING
# =====================================================

password_hash = PasswordHash.recommended()


# =====================================================
# JWT SETTINGS
# =====================================================

SECRET_KEY = os.getenv(
    "JWT_SECRET",
    "CHANGE_THIS_SECRET"
)

ALGORITHM = "HS256"


# =====================================================
# REQUEST MODELS
# =====================================================

class SignupRequest(BaseModel):

    full_name: str

    email: EmailStr

    password: str


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


# =====================================================
# CREATE JWT
# =====================================================

def create_token(student_id: int):

    payload = {
        "student_id": student_id
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =====================================================
# GET LOGGED-IN STUDENT ID
# =====================================================

def get_student_id(
    authorization: str | None
):

    # ---------------------------------------------
    # Check Authorization header
    # ---------------------------------------------

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )


    # ---------------------------------------------
    # Extract Bearer token
    # ---------------------------------------------

    if authorization.startswith(
        "Bearer "
    ):

        token = authorization[
            7:
        ].strip()

    else:

        # Also allow raw token
        token = authorization.strip()


    if not token:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )


    # ---------------------------------------------
    # Decode JWT
    # ---------------------------------------------

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )


    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired."
        )


    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )


    # ---------------------------------------------
    # Get student ID
    # ---------------------------------------------

    student_id = payload.get(
            "student_id"
        )


    if student_id is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )


    try:

        return int(student_id)

    except (
        TypeError,
        ValueError
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid student ID in token."
        )


# =====================================================
# SIGNUP
# =====================================================

@router.post("/signup")
def signup(
    data: SignupRequest
):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # -----------------------------------------
            # Check whether email already exists
            # -----------------------------------------

            cursor.execute(
                """
                SELECT student_id
                FROM students
                WHERE email = %s
                """,
                (data.email,)
            )

            existing_student = cursor.fetchone()


            if existing_student:

                raise HTTPException(
                    status_code=409,
                    detail="Email is already registered."
                )


            # -----------------------------------------
            # Hash password
            # -----------------------------------------

            hashed_password = (
                password_hash.hash(
                    data.password
                )
            )


            # -----------------------------------------
            # Create student
            # -----------------------------------------

            cursor.execute(
                """
                INSERT INTO students
                (
                    email,
                    password_hash,
                    full_name
                )
                VALUES
                (
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    data.email,
                    hashed_password,
                    data.full_name
                )
            )


            connection.commit()


            student_id = (
                cursor.lastrowid
            )


            # -----------------------------------------
            # Create JWT
            # -----------------------------------------

            token = create_token(
                student_id
            )


            return {

                "message":
                    "Account created successfully.",

                "student_id":
                    student_id,

                "full_name":
                    data.full_name,

                "token":
                    token

            }


    finally:

        connection.close()


# =====================================================
# LOGIN
# =====================================================

@router.post("/login")
def login(
    data: LoginRequest
):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # -----------------------------------------
            # Find student
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    student_id,
                    email,
                    password_hash,
                    full_name
                FROM students
                WHERE email = %s
                """,
                (data.email,)
            )

            student = cursor.fetchone()


            # -----------------------------------------
            # User not found
            # -----------------------------------------

            if not student:

                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password."
                )


            # -----------------------------------------
            # Verify password
            # -----------------------------------------

            password_valid = (
                password_hash.verify(
                    data.password,
                    student[
                        "password_hash"
                    ]
                )
            )


            if not password_valid:

                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password."
                )


            # -----------------------------------------
            # Create JWT
            # -----------------------------------------

            token = create_token(
                student[
                    "student_id"
                ]
            )


            return {

                "message":
                    "Login successful.",

                "student_id":
                    student[
                        "student_id"
                    ],

                "full_name":
                    student[
                        "full_name"
                    ],

                "email":
                    student[
                        "email"
                    ],

                "token":
                    token

            }


    finally:

        connection.close()