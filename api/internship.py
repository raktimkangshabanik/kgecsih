from fastapi import (
    APIRouter,
    Query,
    HTTPException,
    Header
)

from typing import Optional
from datetime import date

from pymysql.cursors import DictCursor

from database.connection import get_connection
from api.auth import get_student_id


router = APIRouter(
    prefix="/internships",
    tags=["Internships"]
)


# =====================================================
# MATCHING WEIGHTS
# =====================================================

WEIGHT_SKILLS = 40.0
WEIGHT_ROLE = 14.0
WEIGHT_FIELD = 9.0
WEIGHT_EXPERIENCE = 15.0
WEIGHT_QUALIFICATION = 9.0
WEIGHT_WORK_PREFERENCE = 7.0
WEIGHT_LOCATION = 4.0
WEIGHT_GRADUATION = 2.0


# =====================================================
# TEXT NORMALIZATION
# =====================================================

def normalize_text(value):

    if value is None:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .replace("-", " ")
        .replace("/", " ")
        .split()
    )


# =====================================================
# SKILL MATCHING
# =====================================================

def calculate_skill_score(
    student_skills,
    internship_skills
):

    if not student_skills:
        return 0.0

    if not internship_skills:
        return 0.0


    student_skill_map = {

        int(skill["skill_id"]):
            normalize_text(
                skill.get("proficiency")
            )

        for skill in student_skills

    }


    mandatory_skills = [

        skill
        for skill in internship_skills
        if bool(skill["is_mandatory"])

    ]


    preferred_skills = [

        skill
        for skill in internship_skills
        if not bool(skill["is_mandatory"])

    ]


    # -------------------------------------------------
    # MANDATORY SKILLS
    # -------------------------------------------------

    mandatory_score = 0.0


    if mandatory_skills:

        matched_weight = 0.0


        for skill in mandatory_skills:

            skill_id = int(
                skill["skill_id"]
            )


            if skill_id not in student_skill_map:
                continue


            proficiency = (
                student_skill_map[
                    skill_id
                ]
            )


            if proficiency == "advanced":

                matched_weight += 1.0

            elif proficiency == "intermediate":

                matched_weight += 0.85

            elif proficiency == "beginner":

                matched_weight += 0.65

            else:

                matched_weight += 0.75


        mandatory_score = (
            matched_weight /
            len(mandatory_skills)
        )


    # -------------------------------------------------
    # PREFERRED SKILLS
    # -------------------------------------------------

    preferred_score = 0.0


    if preferred_skills:

        matched_weight = 0.0


        for skill in preferred_skills:

            skill_id = int(
                skill["skill_id"]
            )


            if skill_id not in student_skill_map:
                continue


            proficiency = (
                student_skill_map[
                    skill_id
                ]
            )


            if proficiency == "advanced":

                matched_weight += 1.0

            elif proficiency == "intermediate":

                matched_weight += 0.85

            elif proficiency == "beginner":

                matched_weight += 0.65

            else:

                matched_weight += 0.75


        preferred_score = (
            matched_weight /
            len(preferred_skills)
        )


    # -------------------------------------------------
    # COMBINE
    # -------------------------------------------------

    if mandatory_skills and preferred_skills:

        combined = (
            mandatory_score * 0.75
            +
            preferred_score * 0.25
        )

    elif mandatory_skills:

        combined = mandatory_score

    elif preferred_skills:

        combined = preferred_score

    else:

        # No skill requirements means
        # no skill-match points.
        combined = 0.0


    return round(
        combined * WEIGHT_SKILLS,
        2
    )


# =====================================================
# PREFERRED ROLE MATCHING
# =====================================================

def calculate_role_score(
    internship,
    preferred_roles
):

    if not preferred_roles:
        return 0.0


    internship_role_id = int(
        internship["role_id"]
    )


    for preferred in preferred_roles:

        if (
            int(preferred["role_id"])
            != internship_role_id
        ):

            continue


        priority = int(
            preferred["priority"]
        )


        if priority == 1:

            return WEIGHT_ROLE

        elif priority == 2:

            return WEIGHT_ROLE * 0.85

        elif priority == 3:

            return WEIGHT_ROLE * 0.70

        elif priority == 4:

            return WEIGHT_ROLE * 0.55

        else:

            return WEIGHT_ROLE * 0.40


    return 0.0


# =====================================================
# FIELD / DISCIPLINE MATCH
# =====================================================

def calculate_field_score(
    student,
    internship
):

    field = normalize_text(
        student.get(
            "field_of_study"
        )
    )


    if not field:
        return 0.0


    internship_text = " ".join([

        normalize_text(
            internship.get(
                "role_name"
            )
        ),

        normalize_text(
            internship.get(
                "category"
            )
        ),

        normalize_text(
            internship.get(
                "internship_title"
            )
        ),

        normalize_text(
            internship.get(
                "description"
            )
        )

    ])


    # Direct match.

    if field in internship_text:

        return WEIGHT_FIELD


    # Related disciplines.

    field_groups = {

        "computer": [
            "computer science",
            "information technology",
            "software",
            "programming",
            "computer"
        ],

        "software": [
            "computer science",
            "information technology",
            "software",
            "programming"
        ],

        "information technology": [
            "computer science",
            "information technology",
            "software"
        ],

        "mechanical": [
            "mechanical",
            "manufacturing",
            "automotive",
            "robotics"
        ],

        "electrical": [
            "electrical",
            "electronics",
            "embedded",
            "power"
        ],

        "electronics": [
            "electronics",
            "electrical",
            "embedded",
            "communication"
        ],

        "physics": [
            "physics",
            "research",
            "scientific",
            "aerospace"
        ],

        "chemistry": [
            "chemistry",
            "chemical",
            "materials",
            "research"
        ],

        "mathematics": [
            "mathematics",
            "statistics",
            "data",
            "analytics"
        ],

        "economics": [
            "economics",
            "finance",
            "business",
            "analytics"
        ],

        "management": [
            "management",
            "business",
            "marketing",
            "finance",
            "operations"
        ],

        "commerce": [
            "commerce",
            "finance",
            "accounting",
            "business"
        ],

        "civil": [
            "civil",
            "construction",
            "structural",
            "infrastructure"
        ]

    }


    for key, related_fields in field_groups.items():

        if key in field:

            for related in related_fields:

                if related in internship_text:

                    return (
                        WEIGHT_FIELD * 0.75
                    )


    # Partial word match.

    field_words = [

        word
        for word in field.split()
        if len(word) >= 4

    ]


    if field_words:

        matched_words = sum(

            1
            for word in field_words
            if word in internship_text

        )


        if matched_words:

            ratio = (
                matched_words /
                len(field_words)
            )


            return round(
                WEIGHT_FIELD
                * ratio
                * 0.60,
                2
            )


    return 0.0


# =====================================================
# EXPERIENCE MATCH
# =====================================================

def calculate_experience_score(
    student,
    internship
):

    student_experience = float(
        student.get(
            "experience_months"
        ) or 0
    )


    required_experience = float(
        internship.get(
            "min_experience_months"
        ) or 0
    )


    # No student experience but
    # internship requires experience.

    if (
        student_experience <= 0
        and required_experience > 0
    ):

        return 0.0


    # Internship accepts freshers.

    if required_experience <= 0:

        if student_experience > 0:

            return WEIGHT_EXPERIENCE

        return WEIGHT_EXPERIENCE * 0.50


    # Student satisfies requirement.

    if (
        student_experience >=
        required_experience
    ):

        return WEIGHT_EXPERIENCE


    ratio = (
        student_experience /
        required_experience
    )


    if ratio >= 0.75:

        return WEIGHT_EXPERIENCE * 0.75

    elif ratio >= 0.50:

        return WEIGHT_EXPERIENCE * 0.50

    elif ratio >= 0.25:

        return WEIGHT_EXPERIENCE * 0.25


    return 0.0


# =====================================================
# QUALIFICATION MATCH
# =====================================================

def calculate_qualification_score(
    student,
    internship
):

    qualification = normalize_text(
        student.get(
            "highest_qualification"
        )
    )


    if not qualification:

        return 0.0


    internship_text = " ".join([

        normalize_text(
            internship.get(
                "role_name"
            )
        ),

        normalize_text(
            internship.get(
                "category"
            )
        ),

        normalize_text(
            internship.get(
                "internship_title"
            )
        ),

        normalize_text(
            internship.get(
                "description"
            )
        )

    ])


    qualification_groups = {

        "b tech": [
            "b tech",
            "btech",
            "bachelor",
            "engineering"
        ],

        "b.e": [
            "b e",
            "bachelor",
            "engineering"
        ],

        "be": [
            "b e",
            "bachelor",
            "engineering"
        ],

        "m tech": [
            "m tech",
            "mtech",
            "master",
            "engineering"
        ],

        "mca": [
            "mca",
            "computer",
            "software",
            "technology"
        ],

        "bsc": [
            "bsc",
            "bachelor",
            "science"
        ],

        "m sc": [
            "m sc",
            "msc",
            "master",
            "science"
        ],

        "mba": [
            "mba",
            "management",
            "business"
        ],

        "phd": [
            "phd",
            "research",
            "scientific"
        ]

    }


    matched_keywords = None


    for key, keywords in qualification_groups.items():

        if key in qualification:

            matched_keywords = keywords

            break


    if not matched_keywords:

        return WEIGHT_QUALIFICATION * 0.30


    for keyword in matched_keywords:

        if keyword in internship_text:

            return WEIGHT_QUALIFICATION


    # Qualification exists, but internship
    # doesn't explicitly mention it.

    return WEIGHT_QUALIFICATION * 0.30


# =====================================================
# WORK PREFERENCE MATCH
# =====================================================

def calculate_work_preference_score(
    student,
    internship
):

    preference = normalize_text(
        student.get(
            "work_preference"
        )
    )


    internship_type = normalize_text(
        internship.get(
            "work_type"
        )
    )


    # "Any" = neutral.
    if (
        not preference
        or preference == "any"
    ):

        return 0.0


    if preference == internship_type:

        return WEIGHT_WORK_PREFERENCE


    # Hybrid compatibility.

    if (
        preference == "hybrid"
        and internship_type in {
            "on site",
            "remote"
        }
    ):

        return (
            WEIGHT_WORK_PREFERENCE
            * 0.50
        )


    if (
        internship_type == "hybrid"
        and preference in {
            "on site",
            "remote"
        }
    ):

        return (
            WEIGHT_WORK_PREFERENCE
            * 0.50
        )


    return 0.0


# =====================================================
# LOCATION MATCH
# =====================================================

def calculate_location_score(
    student,
    internship
):

    preferred_location = normalize_text(
        student.get(
            "preferred_work_location"
        )
    )


    internship_location = normalize_text(
        internship.get(
            "location"
        )
    )


    internship_type = normalize_text(
        internship.get(
            "work_type"
        )
    )


    if (
        not preferred_location
        or preferred_location in {
            "any",
            "any location"
        }
    ):

        return 0.0


    if not internship_location:

        if internship_type == "remote":

            return (
                WEIGHT_LOCATION
                * 0.50
            )

        return 0.0


    if (
        preferred_location in internship_location
        or internship_location in preferred_location
    ):

        return WEIGHT_LOCATION


    preferred_city = (
        preferred_location
        .split(",")[0]
        .strip()
    )


    internship_city = (
        internship_location
        .split(",")[0]
        .strip()
    )


    if (
        preferred_city
        and internship_city
        and preferred_city == internship_city
    ):

        return WEIGHT_LOCATION


    if internship_type == "remote":

        return (
            WEIGHT_LOCATION
            * 0.50
        )


    return 0.0


# =====================================================
# GRADUATION YEAR MATCH
# =====================================================

def calculate_graduation_score(
    student
):

    graduation_year = student.get(
        "graduation_year"
    )


    if not graduation_year:

        return 0.0


    try:

        year = int(
            graduation_year
        )

    except (
        TypeError,
        ValueError
    ):

        return 0.0


    current_year = date.today().year


    if (
        current_year
        <= year
        <= current_year + 3
    ):

        return WEIGHT_GRADUATION


    if year == current_year - 1:

        return (
            WEIGHT_GRADUATION
            * 0.75
        )


    if year == current_year - 2:

        return (
            WEIGHT_GRADUATION
            * 0.50
        )


    return (
        WEIGHT_GRADUATION
        * 0.25
    )


# =====================================================
# COMPLETE MATCH SCORE
# =====================================================

def calculate_match_score(
    student,
    internship,
    student_skills,
    internship_skills,
    preferred_roles
):

    skills_score = calculate_skill_score(
        student_skills,
        internship_skills
    )


    role_score = calculate_role_score(
        internship,
        preferred_roles
    )


    field_score = calculate_field_score(
        student,
        internship
    )


    experience_score = calculate_experience_score(
        student,
        internship
    )


    qualification_score = (
        calculate_qualification_score(
            student,
            internship
        )
    )


    work_score = (
        calculate_work_preference_score(
            student,
            internship
        )
    )


    location_score = (
        calculate_location_score(
            student,
            internship
        )
    )


    graduation_score = (
        calculate_graduation_score(
            student
        )
    )


    total = (

        skills_score

        + role_score

        + field_score

        + experience_score

        + qualification_score

        + work_score

        + location_score

        + graduation_score

    )


    return round(

        max(
            0.0,
            min(
                total,
                100.0
            )
        ),

        1

    )


# =====================================================
# GET STUDENT
# =====================================================

def get_student_data(
    connection,
    student_id
):

    cursor = connection.cursor(
        DictCursor
    )


    try:

        cursor.execute(
            """
            SELECT
                student_id,
                full_name,
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


        return student

    finally:

        cursor.close()


# =====================================================
# GET STUDENT SKILLS
# =====================================================

def get_student_skills(
    connection,
    student_id
):

    cursor = connection.cursor(
        DictCursor
    )


    try:

        cursor.execute(
            """
            SELECT
                ss.skill_id,
                s.skill_name,
                ss.proficiency
            FROM student_skills ss
            INNER JOIN skills s
                ON s.skill_id = ss.skill_id
            WHERE ss.student_id = %s
            ORDER BY s.skill_name
            """,
            (student_id,)
        )


        return cursor.fetchall()

    finally:

        cursor.close()


# =====================================================
# GET PREFERRED ROLES
# =====================================================

def get_preferred_roles(
    connection,
    student_id
):

    cursor = connection.cursor(
        DictCursor
    )


    try:

        cursor.execute(
            """
            SELECT
                spr.role_id,
                spr.priority,
                r.role_name
            FROM student_preferred_roles spr
            INNER JOIN roles r
                ON r.role_id = spr.role_id
            WHERE spr.student_id = %s
            ORDER BY spr.priority ASC
            """,
            (student_id,)
        )


        return cursor.fetchall()

    finally:

        cursor.close()


# =====================================================
# GET INTERNSHIP SKILLS
# =====================================================

def get_internship_skills(
    connection,
    internship_id
):

    cursor = connection.cursor(
        DictCursor
    )


    try:

        cursor.execute(
            """
            SELECT
                isk.skill_id,
                s.skill_name,
                isk.is_mandatory
            FROM internship_skills isk
            INNER JOIN skills s
                ON s.skill_id = isk.skill_id
            WHERE isk.internship_id = %s
            ORDER BY
                isk.is_mandatory DESC,
                s.skill_name ASC
            """,
            (internship_id,)
        )


        return cursor.fetchall()

    finally:

        cursor.close()


# =====================================================
# MAIN INTERNSHIP ENDPOINT
# =====================================================

@router.get("/")
def get_internships(

    authorization: Optional[str] = Header(
        default=None
    ),

    keyword: Optional[str] = None,

    company: Optional[str] = None,

    location: Optional[str] = None,

    work_type: Optional[str] = Query(
        default=None,
        pattern="^(On-site|Remote|Hybrid)$"
    ),

    max_duration: Optional[float] = None,

    sort_by: str = Query(
        default="match"
    ),

    order: str = Query(
        default="desc",
        pattern="^(asc|desc)$"
    ),

    limit: int = Query(
        default=10,
        ge=1,
        le=100
    )
):

    # =================================================
    # LOGGED-IN STUDENT
    # =================================================

    student_id = get_student_id(
        authorization
    )


    connection = get_connection()


    try:

        # =================================================
        # LOAD STUDENT PROFILE
        # =================================================

        student = get_student_data(
            connection,
            student_id
        )


        student_skills = get_student_skills(
            connection,
            student_id
        )


        preferred_roles = get_preferred_roles(
            connection,
            student_id
        )


        # =================================================
        # CHECK PROFILE DATA
        # =================================================

        work_preference = normalize_text(
            student.get(
                "work_preference"
            )
        )


        preferred_location = normalize_text(
            student.get(
                "preferred_work_location"
            )
        )


        has_real_profile_data = any([

            bool(
                student.get(
                    "highest_qualification"
                )
            ),

            bool(
                student.get(
                    "field_of_study"
                )
            ),

            bool(
                student.get(
                    "graduation_year"
                )
            ),

            bool(
                student.get(
                    "experience_months"
                )
            ),

            bool(
                student_skills
            ),

            bool(
                preferred_roles
            ),

            (
                work_preference
                not in {
                    "",
                    "any"
                }
            ),

            (
                preferred_location
                not in {
                    "",
                    "any",
                    "any location"
                }
            )

        ])


        # =================================================
        # EMPTY PROFILE
        # =================================================

        if not has_real_profile_data:

            return {

                "count": 0,

                "profile_ready": False,

                "message":
                    "Complete your profile to get internship matches.",

                "student": {

                    "name":
                        student[
                            "full_name"
                        ]

                },

                "internships": []

            }


        # =================================================
        # FETCH ACTIVE INTERNSHIPS
        # =================================================

        cursor = connection.cursor(
            DictCursor
        )


        query = """
            SELECT

                i.internship_id,

                i.company_id,

                i.role_id,

                i.internship_title,

                i.work_type,

                i.location,

                i.duration_months,

                i.min_experience_months,

                i.last_date_to_apply,

                i.stipend_min,

                i.stipend_max,

                i.company_website,

                i.application_url,

                i.description,

                i.created_at,

                c.company_name,

                r.role_name,

                r.category

            FROM internships i

            INNER JOIN companies c
                ON c.company_id = i.company_id

            INNER JOIN roles r
                ON r.role_id = i.role_id

            WHERE
                i.last_date_to_apply >= CURDATE()
        """


        params = []


        # =================================================
        # COMPANY FILTER
        # =================================================

        if company:

            query += """
                AND c.company_name LIKE %s
            """

            params.append(
                f"%{company}%"
            )


        # =================================================
        # LOCATION FILTER
        # =================================================

        if location:

            query += """
                AND i.location LIKE %s
            """

            params.append(
                f"%{location}%"
            )


        # =================================================
        # WORK TYPE FILTER
        # =================================================

        if work_type:

            query += """
                AND i.work_type = %s
            """

            params.append(
                work_type
            )


        # =================================================
        # DURATION FILTER
        # =================================================

        if max_duration is not None:

            query += """
                AND i.duration_months <= %s
            """

            params.append(
                max_duration
            )


        # =================================================
        # KEYWORD FILTER
        # =================================================

        if keyword:

            query += """
                AND (
                    i.internship_title LIKE %s
                    OR c.company_name LIKE %s
                    OR r.role_name LIKE %s
                    OR r.category LIKE %s
                    OR i.description LIKE %s
                    OR i.location LIKE %s
                )
            """


            value = f"%{keyword}%"


            params.extend([

                value,
                value,
                value,
                value,
                value,
                value

            ])


        cursor.execute(
            query,
            params
        )


        internships = cursor.fetchall()


        cursor.close()


        # =================================================
        # MATCH INTERNSHIPS
        # =================================================

        results = []


        student_skill_ids = {

            int(
                skill["skill_id"]
            )

            for skill in student_skills

        }


        for internship in internships:

            skills = get_internship_skills(
                connection,
                internship[
                    "internship_id"
                ]
            )


            score = calculate_match_score(

                student,

                internship,

                student_skills,

                skills,

                preferred_roles

            )


            # ---------------------------------------------
            # MATCHED / MISSING SKILLS
            # ---------------------------------------------

            matched_skills = []

            missing_skills = []


            for skill in skills:

                if (
                    int(
                        skill["skill_id"]
                    )
                    in student_skill_ids
                ):

                    matched_skills.append(
                        skill[
                            "skill_name"
                        ]
                    )

                else:

                    missing_skills.append(
                        skill[
                            "skill_name"
                        ]
                    )


            # ---------------------------------------------
            # RESULT OBJECT
            # ---------------------------------------------

            result = {

                "internship_id":
                    internship[
                        "internship_id"
                    ],

                "company_name":
                    internship[
                        "company_name"
                    ],

                "internship_title":
                    internship[
                        "internship_title"
                    ],

                "position":
                    internship[
                        "role_name"
                    ],

                "location":
                    internship[
                        "location"
                    ],

                "work_type":
                    internship[
                        "work_type"
                    ],

                "duration_months":
                    float(
                        internship[
                            "duration_months"
                        ]
                    ),

                "min_experience_months":
                    internship[
                        "min_experience_months"
                    ],

                "last_date_to_apply":
                    internship[
                        "last_date_to_apply"
                    ].isoformat(),

                "stipend_min":
                    internship[
                        "stipend_min"
                    ],

                "stipend_max":
                    internship[
                        "stipend_max"
                    ],

                "description":
                    internship[
                        "description"
                    ],

                "application_url":
                    internship[
                        "application_url"
                    ],

                "company_website":
                    internship[
                        "company_website"
                    ],

                "match_score":
                    score,

                "matched_skills":
                    matched_skills,

                "missing_skills":
                    missing_skills

            }


            results.append(
                result
            )


        # =================================================
        # SORT
        # =================================================

        reverse = (
            order == "desc"
        )


        if sort_by == "match":

            results.sort(

                key=lambda x:
                    x[
                        "match_score"
                    ],

                reverse=reverse

            )


        elif sort_by == "deadline":

            results.sort(

                key=lambda x:
                    x[
                        "last_date_to_apply"
                    ],

                reverse=reverse

            )


        elif sort_by == "stipend":

            results.sort(

                key=lambda x:
                    x[
                        "stipend_max"
                    ] or 0,

                reverse=reverse

            )


        elif sort_by == "newest":

            results.sort(

                key=lambda x:
                    x[
                        "internship_id"
                    ],

                reverse=reverse

            )


        # =================================================
        # TOP RESULTS
        # =================================================

        results = results[:limit]


        # =================================================
        # FINAL RESPONSE
        # =================================================

        return {

            "count":
                len(results),

            "profile_ready":
                True,

            "student": {

                "name":
                    student[
                        "full_name"
                    ]

            },

            "internships":
                results

        }


    finally:

        connection.close()