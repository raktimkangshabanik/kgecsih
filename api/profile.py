# =====================================================
# PROFILE API
# =====================================================

from typing import Optional
import re

from fastapi import (
    APIRouter,
    Header,
    HTTPException
)

from pydantic import BaseModel, Field

from database.connection import get_connection
from api.auth import get_student_id


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)


# =====================================================
# PERSONAL INFORMATION MODEL
# =====================================================

class PersonalUpdate(BaseModel):

    full_name: str = Field(
        min_length=1,
        max_length=120
    )

    location: Optional[str] = None

    phone: str = Field(
        pattern=r"^\+91-[0-9]{5}-[0-9]{5}$"
    )


# =====================================================
# PROFESSIONAL INFORMATION MODEL
# =====================================================

class ExperienceItem(BaseModel):

    start_year: int = Field(
        ge=1950,
        le=2100
    )

    end_year: int = Field(
        ge=1950,
        le=2100
    )

    position: str = Field(
        min_length=1,
        max_length=120
    )


class LanguageItem(BaseModel):

    language_name: str = Field(
        min_length=1,
        max_length=80
    )

    proficiency: str = "Intermediate"


class ProfessionalUpdate(BaseModel):

    work_preference: str = "Any"

    preferred_work_location: Optional[str] = None

    experiences: list[ExperienceItem] = Field(
        default_factory=list
    )

    highest_qualification: str = Field(
        min_length=1,
        max_length=100
    )

    field_of_study: Optional[str] = None

    graduation_year: Optional[int] = None


class LanguagesUpdate(BaseModel):

    languages: list[LanguageItem] = Field(
        default_factory=list
    )


# =====================================================
# SKILL MODEL
# =====================================================

class SkillAdd(BaseModel):

    skill_id: int

    proficiency: str = "Intermediate"


# =====================================================
# GET COMPLETE PROFILE
# =====================================================

@router.get("")
def get_profile(
    authorization: Optional[str] = Header(
        default=None
    )
):

    student_id = get_student_id(
        authorization
    )

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # -----------------------------------------
            # STUDENT INFORMATION
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    student_id,
                    email,
                    full_name,
                    location,
                    phone,
                    work_preference,
                    preferred_work_location,
                    experience_months,
                    highest_qualification,
                    field_of_study,
                    graduation_year
                FROM students
                WHERE student_id = %s
                """,
                (student_id,)
            )

            student = cursor.fetchone()


            if not student:

                raise HTTPException(
                    status_code=404,
                    detail="Student profile not found."
                )


            # -----------------------------------------
            # STUDENT EXPERIENCE
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    experience_id,
                    start_year,
                    end_year,
                    position
                FROM student_experience
                WHERE student_id = %s
                ORDER BY start_year DESC, end_year DESC
                """,
                (student_id,)
            )

            experiences = cursor.fetchall()


            # -----------------------------------------
            # STUDENT LANGUAGES
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    language_id,
                    language_name,
                    proficiency
                FROM student_languages
                WHERE student_id = %s
                ORDER BY language_name
                """,
                (student_id,)
            )

            languages = cursor.fetchall()


            # -----------------------------------------
            # STUDENT SKILLS
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    s.skill_id,
                    s.skill_name,
                    ss.proficiency
                FROM student_skills ss
                INNER JOIN skills s
                    ON ss.skill_id = s.skill_id
                WHERE ss.student_id = %s
                ORDER BY s.skill_name
                """,
                (student_id,)
            )

            skills = cursor.fetchall()


            return {
                "student": student,
                "skills": skills,
                "experiences": experiences,
                "languages": languages
            }

    finally:

        connection.close()


# =====================================================
# UPDATE PERSONAL INFORMATION
# =====================================================

@router.put("/personal")
def update_personal(
    data: PersonalUpdate,
    authorization: Optional[str] = Header(
        default=None
    )
):

    student_id = get_student_id(
        authorization
    )


    # ---------------------------------------------
    # EXTRA PHONE VALIDATION
    # ---------------------------------------------

    if not re.fullmatch(
        r"\+91-[0-9]{5}-[0-9]{5}",
        data.phone
    ):

        raise HTTPException(
            status_code=400,
            detail="Phone must be in the format +91-90000-00018."
        )


    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE students
                SET
                    full_name = %s,
                    location = %s,
                    phone = %s
                WHERE student_id = %s
                """,
                (
                    data.full_name.strip(),
                    data.location,
                    data.phone,
                    student_id
                )
            )

            connection.commit()


            return {
                "message":
                    "Personal information saved successfully."
            }

    finally:

        connection.close()


# =====================================================
# UPDATE PROFESSIONAL INFORMATION
# =====================================================

@router.put("/professional")
def update_professional(
    data: ProfessionalUpdate,
    authorization: Optional[str] = Header(
        default=None
    )
):

    student_id = get_student_id(
        authorization
    )


    # ---------------------------------------------
    # WORK PREFERENCE VALIDATION
    # ---------------------------------------------

    allowed_preferences = {
        "On-site",
        "Remote",
        "Hybrid",
        "Any"
    }


    if data.work_preference not in allowed_preferences:

        raise HTTPException(
            status_code=400,
            detail="Invalid work preference."
        )


    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE students
                SET
                    work_preference = %s,
                    preferred_work_location = %s,
                    highest_qualification = %s,
                    field_of_study = %s,
                    graduation_year = %s
                WHERE student_id = %s
                """,
                (
                    data.work_preference,
                    data.preferred_work_location,
                    data.highest_qualification,
                    data.field_of_study,
                    data.graduation_year,
                    student_id
                )
            )

            for experience in data.experiences:
                if experience.end_year < experience.start_year:
                    raise HTTPException(
                        status_code=400,
                        detail="Experience 'Year To' cannot be before 'Year From'."
                    )

            cursor.execute(
                """
                DELETE FROM student_experience
                WHERE student_id = %s
                """,
                (student_id,)
            )

            total_months = 0

            for experience in data.experiences:
                cursor.execute(
                    """
                    INSERT INTO student_experience
                    (
                        student_id,
                        start_year,
                        end_year,
                        position
                    )
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        student_id,
                        experience.start_year,
                        experience.end_year,
                        experience.position.strip()
                    )
                )

                total_months += (
                    experience.end_year -
                    experience.start_year
                ) * 12

            cursor.execute(
                """
                UPDATE students
                SET experience_months = %s
                WHERE student_id = %s
                """,
                (total_months, student_id)
            )

            connection.commit()


            return {
                "message":
                    "Professional information saved successfully."
            }

    finally:

        connection.close()


# =====================================================
# GET ALL AVAILABLE SKILLS
# =====================================================

@router.get("/skills")
def get_all_skills(
    authorization: Optional[str] = Header(
        default=None
    )
):

    # ---------------------------------------------
    # MAKE SURE USER IS LOGGED IN
    # ---------------------------------------------

    get_student_id(
        authorization
    )


    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    skill_id,
                    skill_name
                FROM skills
                ORDER BY skill_name
                """
            )

            skills = cursor.fetchall()


            return {
                "skills": skills
            }

    finally:

        connection.close()


# =====================================================
# ADD / UPDATE A STUDENT SKILL
# =====================================================

@router.post("/skills")
def add_skill(
    data: SkillAdd,
    authorization: Optional[str] = Header(
        default=None
    )
):

    student_id = get_student_id(
        authorization
    )


    # ---------------------------------------------
    # PROFICIENCY VALIDATION
    # ---------------------------------------------

    allowed_levels = {
        "Beginner",
        "Intermediate",
        "Advanced"
    }


    if data.proficiency not in allowed_levels:

        raise HTTPException(
            status_code=400,
            detail="Invalid proficiency level."
        )


    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # -------------------------------------
            # CHECK WHETHER SKILL EXISTS
            # -------------------------------------

            cursor.execute(
                """
                SELECT
                    skill_id,
                    skill_name
                FROM skills
                WHERE skill_id = %s
                """,
                (data.skill_id,)
            )

            skill = cursor.fetchone()


            if not skill:

                raise HTTPException(
                    status_code=404,
                    detail="Skill not found."
                )


            # -------------------------------------
            # ADD OR UPDATE STUDENT SKILL
            # -------------------------------------

            cursor.execute(
                """
                INSERT INTO student_skills
                (
                    student_id,
                    skill_id,
                    proficiency
                )
                VALUES
                (
                    %s,
                    %s,
                    %s
                )
                ON DUPLICATE KEY UPDATE
                    proficiency = VALUES(proficiency)
                """,
                (
                    student_id,
                    data.skill_id,
                    data.proficiency
                )
            )

            connection.commit()


            return {
                "message":
                    "Skill saved successfully.",
                "skill_id":
                    data.skill_id,
                "skill_name":
                    skill["skill_name"],
                "proficiency":
                    data.proficiency
            }

    finally:

        connection.close()


# =====================================================
# ADD CUSTOM SKILL
# =====================================================

@router.post("/skills/custom")
def add_custom_skill(
    data: dict,
    authorization: Optional[str] = Header(default=None)
):

    student_id = get_student_id(
        authorization
    )

    skill_name = str(
        data.get("skill_name", "")
    ).strip()

    proficiency = str(
        data.get(
            "proficiency",
            "Intermediate"
        )
    ).strip()

    if not skill_name:
        raise HTTPException(
            status_code=400,
            detail="Skill name is required."
        )

    if len(skill_name) > 100:
        raise HTTPException(
            status_code=400,
            detail="Skill name must be at most 100 characters."
        )

    allowed_levels = {
        "Beginner",
        "Intermediate",
        "Advanced"
    }

    if proficiency not in allowed_levels:
        raise HTTPException(
            status_code=400,
            detail="Invalid proficiency level."
        )

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    skill_id,
                    skill_name
                FROM skills
                WHERE LOWER(skill_name) =
                      LOWER(%s)
                """,
                (skill_name,)
            )

            existing = cursor.fetchone()

            if existing:

                skill_id = existing["skill_id"]

                final_name = existing["skill_name"]

            else:

                cursor.execute(
                    """
                    INSERT INTO skills
                    (
                        skill_name
                    )
                    VALUES
                    (%s)
                    """,
                    (skill_name,)
                )

                skill_id = cursor.lastrowid

                final_name = skill_name

            connection.commit()

            return {
                "message":
                    "Custom skill saved successfully.",
                "skill_id":
                    skill_id,
                "skill_name":
                    final_name,
                "proficiency":
                    proficiency
            }

    finally:
        connection.close()


# =====================================================
# UPDATE STUDENT LANGUAGES
# =====================================================

@router.put("/languages")
def update_languages(
    data: LanguagesUpdate,
    authorization: Optional[str] = Header(default=None)
):

    student_id = get_student_id(
        authorization
    )

    allowed_levels = {
        "Basic",
        "Intermediate",
        "Fluent",
        "Native"
    }

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            for language in data.languages:

                language.language_name = language.language_name.strip()

                if not language.language_name:
                    raise HTTPException(
                        status_code=400,
                        detail="Language name is required."
                    )

                if language.proficiency not in allowed_levels:
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid language proficiency."
                    )

            cursor.execute(
                """
                DELETE FROM student_languages
                WHERE student_id = %s
                """,
                (student_id,)
            )

            for language in data.languages:

                cursor.execute(
                    """
                    INSERT INTO student_languages
                    (
                        student_id,
                        language_name,
                        proficiency
                    )
                    VALUES
                    (%s, %s, %s)
                    """,
                    (
                        student_id,
                        language.language_name,
                        language.proficiency
                    )
                )

            connection.commit()

            return {
                "message":
                    "Languages saved successfully."
            }

    finally:
        connection.close()


# =====================================================
# DELETE STUDENT SKILL
# =====================================================

@router.delete("/skills/{skill_id}")
def remove_skill(
    skill_id: int,
    authorization: Optional[str] = Header(
        default=None
    )
):

    student_id = get_student_id(
        authorization
    )


    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                DELETE FROM student_skills
                WHERE
                    student_id = %s
                    AND skill_id = %s
                """,
                (
                    student_id,
                    skill_id
                )
            )


            if cursor.rowcount == 0:

                raise HTTPException(
                    status_code=404,
                    detail="Skill not found in your profile."
                )


            connection.commit()


            return {
                "message":
                    "Skill removed successfully."
            }

    finally:

        connection.close()