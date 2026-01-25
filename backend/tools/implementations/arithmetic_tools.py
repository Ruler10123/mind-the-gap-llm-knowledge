"""Arithmetic tool implementations."""

from typing import Any

from tools.base import BaseTool
from tools.schemas import ArithmeticInput


class AddTool(BaseTool):
    """Add two integers."""

    def __init__(self):
        super().__init__(
            name="add",
            description="Add two integers. Use for basic arithmetic when the user asks to add numbers.",
            is_read_only=True,
            schema=ArithmeticInput,
        )

    async def execute(self, args: dict[str, Any]) -> int:
        """Execute addition."""
        return args["a"] + args["b"]


class MultiplyTool(BaseTool):
    """Multiply two integers."""

    def __init__(self):
        super().__init__(
            name="multiply",
            description="Multiply two integers. Use for basic arithmetic when the user asks to multiply numbers.",
            is_read_only=True,
            schema=ArithmeticInput,
        )

    async def execute(self, args: dict[str, Any]) -> int:
        """Execute multiplication."""
        return args["a"] * args["b"]


class DivideTool(BaseTool):
    """Divide two integers."""

    def __init__(self):
        super().__init__(
            name="divide",
            description="Divide a by b. Use for basic arithmetic when the user asks to divide numbers. b must not be 0.",
            is_read_only=True,
            schema=ArithmeticInput,
        )

    async def execute(self, args: dict[str, Any]) -> float:
        """Execute division."""
        if args["b"] == 0:
            raise ZeroDivisionError("Cannot divide by zero")
        return args["a"] / args["b"]
