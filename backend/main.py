"""FastAPI app: CORS, /health, WebSocket /ws for AI assistant.

All subsystems (kiosk demo auth/flights, RAG, ElevenLabs TTS, LLM provider)
are optional. The app will start in a degraded but functional state when
external services are missing — the voice-first /ws loop is the only
hard requirement.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from transport.websocket_handler import WebSocketHandler
from config import settings
from observability.logger import logger

# Global service instances (kiosk demo only)
auth_db_service = None
auth_face_service = None
auth_qr_service = None
flights_db_service = None

# Global RAG service instances
rag_db_service = None
rag_embedding_service = None
rag_service = None


def _init_kiosk_demo() -> tuple[object, object]:
    """Lazy-import and initialize face auth + flights services.

    Returns (auth_router, flights_router) when both initialize successfully,
    otherwise (None, None). Imports happen here so the heavy deps
    (DeepFace / pymongo) are not required for minimal-mode startup.
    """
    global auth_db_service, auth_face_service, auth_qr_service, flights_db_service

    try:
        from auth import auth_router, DatabaseService, FaceRecognitionService, QRService
        from flights import flights_router, DatabaseService as FlightsDatabaseService
        from auth import routes as auth_routes
        from flights import routes as flights_routes
    except Exception as e:
        logger.warning(f"[kiosk-demo] Imports failed, demo features disabled: {e}")
        return None, None

    try:
        settings.auth_temp_dir.mkdir(parents=True, exist_ok=True)
        settings.auth_qr_dir.mkdir(parents=True, exist_ok=True)

        auth_db_service = DatabaseService()
        auth_face_service = FaceRecognitionService()
        auth_qr_service = QRService()
        auth_routes.db_service = auth_db_service
        auth_routes.face_service = auth_face_service
        auth_routes.qr_service = auth_qr_service
        logger.info("[kiosk-demo] Auth services initialized")
    except Exception as e:
        logger.warning(f"[kiosk-demo] Auth init failed: {e}")
        return None, None

    try:
        flights_db_service = FlightsDatabaseService()
        flights_routes.db_service = flights_db_service
        logger.info("[kiosk-demo] Flights services initialized")
    except Exception as e:
        logger.warning(f"[kiosk-demo] Flights init failed: {e}")
        return auth_router, None

    return auth_router, flights_router


def _init_rag() -> None:
    """Initialize RAG service and inject into the agent.

    Picks Atlas Vector Search when rag_backend == "mongo" and the
    connection succeeds, otherwise falls back to the local in-memory
    keyword retriever.
    """
    global rag_db_service, rag_embedding_service, rag_service

    from agent.graph import set_rag_service

    backend = (settings.rag_backend or "local").lower()
    if backend == "mongo":
        try:
            from rag.database import RAGDatabaseService
            from rag.embeddings import EmbeddingService
            from rag.service import RAGService

            rag_db_service = RAGDatabaseService()
            rag_embedding_service = EmbeddingService()
            rag_service = RAGService(rag_db_service, rag_embedding_service)
            set_rag_service(rag_service)
            logger.info("[RAG] MongoDB Atlas backend initialized")
            return
        except Exception as e:
            logger.warning(f"[RAG] MongoDB backend failed ({e}); falling back to local")

    try:
        from rag.local_rag import LocalRAGService
        rag_service = LocalRAGService()
        set_rag_service(rag_service)
        logger.info(f"[RAG] Local backend initialized with {len(rag_service.chunks)} chunks")
    except Exception as e:
        logger.warning(f"[RAG] Local backend failed: {e}; knowledge base tool disabled")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle. Every subsystem is best-effort."""
    if settings.enable_kiosk_demo:
        auth_router, flights_router = _init_kiosk_demo()
        if auth_router is not None:
            app.include_router(auth_router, prefix="/api")
        if flights_router is not None:
            app.include_router(flights_router, prefix="/api")
    else:
        logger.info("[startup] Kiosk demo features disabled (set enable_kiosk_demo=true to enable)")

    _init_rag()

    yield

    # Shutdown
    for svc in (auth_db_service, flights_db_service, rag_db_service):
        if svc is not None and hasattr(svc, "close"):
            try:
                svc.close()
            except Exception as e:
                logger.warning(f"[shutdown] close() failed: {e}")


app = FastAPI(title="AI Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev: file://, localhost:*, 127.0.0.1:*
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ws_handler = WebSocketHandler()


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "llm_provider": settings.llm_provider,
        "rag_backend": settings.rag_backend,
        "tts_provider": (settings.tts_provider or "").lower() or "auto",
        "tts_enabled": "true" if ws_handler.tts_service.enabled else "false",
        "kiosk_demo": "true" if settings.enable_kiosk_demo else "false",
    }


@app.websocket("/ws")
async def websocket_assistant(websocket: WebSocket) -> None:
    await ws_handler.handle(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
