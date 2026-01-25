"""Flight Management module."""
from .routes import router as flights_router
from .services.database import DatabaseService

__all__ = ["flights_router", "DatabaseService"]
