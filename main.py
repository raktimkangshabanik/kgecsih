from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from api.auth import router as auth_router
from api.profile import router as profile_router
from api.internship import router as internship_router

app = FastAPI(
    title="KGECSIH API",
    description="AI-powered internship recommendation platform",
    version="1.0.0"
)


# =====================================================
# FRONTEND
# =====================================================

app.mount(
    "/pages",
    StaticFiles(directory="pages"),
    name="pages"
)


# =====================================================
# WELCOME
# =====================================================

@app.get("/")
def home():

    return FileResponse(
        "pages/welcome/welcome.html"
    )


# =====================================================
# API ROUTES
# =====================================================

app.include_router(
    auth_router
)

app.include_router(
    profile_router
)

app.include_router(
    internship_router
)