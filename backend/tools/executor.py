"""Resilient tool executor with timeout and error translation."""

import asyncio
from typing import Any

from config import settings
from core.exceptions import ToolExecutionError
from core.schemas import ToolResult
from observability.logger import logger
from tools.base import BaseTool


class ToolExecutor:
    """Executes tools with timeout and error handling."""

    def __init__(self, timeout_seconds: int | None = None):
        self.timeout_seconds = timeout_seconds or settings.tool_execution_timeout_seconds

    async def execute(self, tool: BaseTool, args: dict[str, Any]) -> ToolResult:
        """Execute tool with timeout and error translation."""
        try:
            # Validate args against schema if provided
            if tool.schema:
                tool.schema(**args)

            # Execute with timeout
            result = await asyncio.wait_for(
                tool.execute(args),
                timeout=self.timeout_seconds,
            )

            logger.info(f"Tool '{tool.name}' executed successfully")
            return ToolResult(
                success=True,
                output=result,
                tool_name=tool.name,
            )

        except asyncio.TimeoutError:
            error_msg = f"Tool '{tool.name}' timed out after {self.timeout_seconds}s"
            logger.error(error_msg)
            return ToolResult(
                success=False,
                error_message=f"The {tool.name} operation timed out",
                tool_name=tool.name,
            )

        except Exception as e:
            logger.error(f"Tool '{tool.name}' failed: {e}")
            tool_error = ToolExecutionError(tool.name, e)
            return ToolResult(
                success=False,
                error_message=tool_error.to_natural_language(),
                tool_name=tool.name,
            )
