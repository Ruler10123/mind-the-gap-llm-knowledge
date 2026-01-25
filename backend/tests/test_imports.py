"""Basic import smoke test."""


def test_core_imports():
    """Verify core modules import correctly."""
    from core import exceptions, events, schemas, interfaces
    from observability.logger import logger
    from config import settings

    assert exceptions is not None
    assert events is not None
    assert schemas is not None
    assert interfaces is not None
    assert logger is not None
    assert settings is not None


def test_tool_imports():
    """Verify tool modules import correctly."""
    from tools.base import BaseTool
    from tools.registry import ToolRegistry
    from tools.executor import ToolExecutor
    from tools.implementations.time_tool import TimeTool
    from tools.implementations.arithmetic_tools import AddTool, MultiplyTool, DivideTool

    assert BaseTool is not None
    assert ToolRegistry is not None
    assert ToolExecutor is not None
    assert TimeTool is not None
    assert AddTool is not None


def test_agent_imports():
    """Verify agent modules import correctly."""
    from agent.state import AgentState
    from agent.strategies import RetryStrategy
    from agent.orchestrator import AgentOrchestrator
    from agent.graph import get_agent

    assert AgentState is not None
    assert RetryStrategy is not None
    assert AgentOrchestrator is not None
    assert get_agent is not None


def test_session_imports():
    """Verify session modules import correctly."""
    from session.models import Session, ConversationTurn
    from session.session_store import InMemorySessionStore
    from session.session_manager import SessionManager

    assert Session is not None
    assert ConversationTurn is not None
    assert InMemorySessionStore is not None
    assert SessionManager is not None


def test_transport_imports():
    """Verify transport modules import correctly."""
    from transport.websocket_handler import WebSocketHandler
    from transport.serializers import event_to_json

    assert WebSocketHandler is not None
    assert event_to_json is not None


def test_tts_imports():
    """Verify TTS modules import correctly."""
    from tts.service import TTSService

    assert TTSService is not None
