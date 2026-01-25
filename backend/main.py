"""FastAPI app: CORS, /health, WebSocket /ws for AI assistant."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from transport.websocket_handler import WebSocketHandler
from auth import auth_router, DatabaseService, FaceRecognitionService, QRService
from flights import flights_router, DatabaseService as FlightsDatabaseService
from config import settings

# Global auth service instances
auth_db_service: DatabaseService = None
auth_face_service: FaceRecognitionService = None
auth_qr_service: QRService = None

# Global flights service instance
flights_db_service: FlightsDatabaseService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global auth_db_service, auth_face_service, auth_qr_service, flights_db_service

    # Initialize auth services
    try:
        # Create runtime directories
        settings.auth_temp_dir.mkdir(parents=True, exist_ok=True)
        settings.auth_qr_dir.mkdir(parents=True, exist_ok=True)

        # Initialize services
        auth_db_service = DatabaseService()
        auth_face_service = FaceRecognitionService()
        auth_qr_service = QRService()

        # Inject services into router
        from auth import routes
        routes.db_service = auth_db_service
        routes.face_service = auth_face_service
        routes.qr_service = auth_qr_service

        print("Auth services initialized successfully")

    except Exception as e:
        print(f"Error initializing auth services: {e}")
        raise

    # Initialize flights services
    try:
        flights_db_service = FlightsDatabaseService()

        # Inject services into router
        from flights import routes as flights_routes
        flights_routes.db_service = flights_db_service

        print("Flights services initialized successfully")
    except Exception as e:
        print(f"Error initializing flights services: {e}")
        raise

    yield

    # Shutdown
    if auth_db_service:
        auth_db_service.close()
    if flights_db_service:
        flights_db_service.close()


app = FastAPI(title="AI Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev: file://, localhost:*, 127.0.0.1:*
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize WebSocket handler
ws_handler = WebSocketHandler()

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(flights_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_assistant(websocket: WebSocket) -> None:
    await ws_handler.handle(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
