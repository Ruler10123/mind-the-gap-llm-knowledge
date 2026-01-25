"""Tool registry for discovery and registration."""

from typing import Any

from tools.base import BaseTool
from tools.implementations.time_tool import TimeTool
from tools.implementations.arithmetic_tools import AddTool, MultiplyTool, DivideTool
from tools.implementations.page_filter_tool import PageFilterTool


class ToolRegistry:
    """Central registry for all tools."""

    def __init__(self):
        self._tools: dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self) -> None:
        """Register built-in tools."""
        self.register(TimeTool())
        self.register(AddTool())
        self.register(MultiplyTool())
        self.register(DivideTool())
        self.register(PageFilterTool())

    def register(self, tool: BaseTool) -> None:
        """Register a tool."""
        self._tools[tool.name] = tool

    def get(self, name: str) -> BaseTool | None:
        """Get tool by name."""
        return self._tools.get(name)

    def get_all(self) -> list[BaseTool]:
        """Get all registered tools."""
        return list(self._tools.values())

    def get_tool_names(self) -> list[str]:
        """Get all tool names."""
        return list(self._tools.keys())
