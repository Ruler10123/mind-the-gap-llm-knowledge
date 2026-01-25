"""Verify refactored structure works."""

import sys


def main():
    """Run verification checks."""
    print("Verifying backend refactoring...")

    # Test imports
    try:
        from core.exceptions import AgentException, ToolExecutionError
        from core.events import BaseEvent, RetryEvent, ErrorEvent
        from core.schemas import ToolResult
        from tools.registry import ToolRegistry
        from tools.executor import ToolExecutor
        from session.session_manager import SessionManager
        from transport.websocket_handler import WebSocketHandler
        from agent.orchestrator import AgentOrchestrator
        print("✓ All imports successful")
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return 1

    # Test tool registry
    try:
        registry = ToolRegistry()
        tools = registry.get_all()
        tool_names = [t.name for t in tools]
        expected = {"get_current_time", "add", "multiply", "divide"}
        assert expected.issubset(set(tool_names)), f"Missing tools. Got: {tool_names}"
        print(f"✓ Tool registry working ({len(tools)} tools)")
    except Exception as e:
        print(f"✗ Tool registry failed: {e}")
        return 1

    # Test error translation
    try:
        error = ToolExecutionError("test_tool", ZeroDivisionError("division by zero"))
        msg = error.to_natural_language()
        assert "divide by zero" in msg.lower()
        print("✓ Error translation working")
    except Exception as e:
        print(f"✗ Error translation failed: {e}")
        return 1

    # Test session manager
    try:
        manager = SessionManager()
        session_id = manager.generate_session_id()
        assert session_id
        print(f"✓ Session manager working")
    except Exception as e:
        print(f"✗ Session manager failed: {e}")
        return 1

    print("\n✅ All verification checks passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
