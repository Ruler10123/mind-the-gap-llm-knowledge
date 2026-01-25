"""Base tool class."""

from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel


class BaseTool(ABC):
    """Base class for all tools."""

    def __init__(
        self,
        name: str,
        description: str,
        is_read_only: bool = True,
        schema: type[BaseModel] | None = None,
    ):
        self.name = name
        self.description = description
        self.is_read_only = is_read_only
        self.schema = schema

    @abstractmethod
    async def execute(self, args: dict[str, Any]) -> Any:
        """Execute tool with arguments."""
        ...
