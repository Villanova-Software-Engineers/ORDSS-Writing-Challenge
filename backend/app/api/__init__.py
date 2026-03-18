from .health import router as health_router
from .semester import router as semester_router
from .user import router as user_router

__all__ = ["health_router", "semester_router", "user_router"]
