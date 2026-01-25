from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, TypedDict, NotRequired

from tools.base import BaseTool
from core.exceptions import ToolExecutionError


Destination = Literal[
    "RESTROOM",
    "CUSTOMER_SERVICE",
    "A28",
    "B9",
    "C43",
    "D12",
]

class MapPayload(TypedDict):
    title: str
    image_src: str
    alt_text: str
    notes: list[str]

class ToolResult(TypedDict):
    ok: bool
    ui_action: str
    modal_id: str
    payload: MapPayload


@dataclass(frozen=True)
class MapEntry:
    title: str
    image_src: str


class OpenMapTool(BaseTool):
    """
    Read-only tool that returns a UI command to open the map modal.

    Assumptions:
    - Single starting location (the kiosk). The X is baked into each PNG.
    - Destination determines which pre-rendered PNG to show.
    """

    name = "open_map"
    description = "Open the kiosk map modal for a known destination."
    is_read_only = True  # important for your RetryStrategy

    # If your BaseTool supports JSON schema exposure, keep this aligned with your agent framework.
    input_schema = {
        "type": "object",
        "properties": {
            "destination": {
                "type": "string",
                "enum": ["RESTROOM", "CUSTOMER_SERVICE", "A28", "B9", "C43", "D12"],
            }
        },
        "required": ["destination"],
        "additionalProperties": False,
    }

    def __init__(self) -> None:
        super().__init__(
            name=self.name,
            description=self.description,
            is_read_only=self.is_read_only,
            schema=None,  # Using input_schema dict instead
        )
        # Simple destination -> image mapping
        self._maps: dict[str, MapEntry] = {
            "RESTROOM": MapEntry("Directions to Restroom", "/RESTROOM.jpg"),
            "CUSTOMER_SERVICE": MapEntry("Directions to Customer Service", "/CUSTOMER_SERVICE.jpg"),
            "A28": MapEntry("Directions to Gate A28", "/A28.jpg"),
            "B9": MapEntry("Directions to Gate B9", "/B9.jpg"),
            "C43": MapEntry("Directions to Gate C43", "/C43.jpg"),
            "D12": MapEntry("Directions to Gate D12", "/D12.jpg"),
        }

    async def execute(self, args: dict[str, Any]) -> ToolResult:
        """Execute tool with arguments (required by BaseTool)."""
        destination = args.get("destination")
        if not destination:
            raise ToolExecutionError(self.name, ValueError("Missing required argument: destination"))
        return self.run(destination=destination)

    def run(self, destination: Destination, **kwargs) -> ToolResult:
        entry = self._maps.get(destination)
        if not entry:
            raise ToolExecutionError(self.name, ValueError(f"Unknown destination: {destination}"))

        return {
            "ok": True,
            "ui_action": "OPEN_MODAL",
            "modal_id": "MAP_MODAL",
            "payload": {
                "title": entry.title,
                "image_src": entry.image_src,
                "alt_text": f"{entry.title}. The X marks your current kiosk location.",
                "notes": ["The X marks your current location. Follow the highlighted path."],
            },
        }
