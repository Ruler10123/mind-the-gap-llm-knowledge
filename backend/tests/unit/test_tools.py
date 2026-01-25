"""Unit tests for tool executor."""

import asyncio
import pytest

from tools.implementations.arithmetic_tools import AddTool, DivideTool
from tools.executor import ToolExecutor


@pytest.mark.asyncio
async def test_tool_executor_success():
    """Test successful tool execution."""
    executor = ToolExecutor(timeout_seconds=5)
    tool = AddTool()
    result = await executor.execute(tool, {"a": 2, "b": 3})

    assert result.success is True
    assert result.output == 5
    assert result.error_message is None


@pytest.mark.asyncio
async def test_tool_executor_error_translation():
    """Test error translation to natural language."""
    executor = ToolExecutor(timeout_seconds=5)
    tool = DivideTool()
    result = await executor.execute(tool, {"a": 10, "b": 0})

    assert result.success is False
    assert "divide by zero" in result.error_message.lower()


@pytest.mark.asyncio
async def test_tool_executor_timeout():
    """Test timeout enforcement."""
    from tools.base import BaseTool

    class SlowTool(BaseTool):
        def __init__(self):
            super().__init__(name="slow_tool", description="Slow", is_read_only=True)

        async def execute(self, args):
            await asyncio.sleep(10)
            return "done"

    executor = ToolExecutor(timeout_seconds=1)
    tool = SlowTool()
    result = await executor.execute(tool, {})

    assert result.success is False
    assert "timed out" in result.error_message.lower()
