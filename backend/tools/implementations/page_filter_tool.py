"""Page filter tool using LLM for routing."""

import json
from typing import Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from tools.base import BaseTool
from tools.schemas import PageFilterInput, PageFilterOutput
from core.exceptions import PageFilterError
from config import settings


class PageFilterTool(BaseTool):
    """Filter UI pages based on user intent using LLM."""

    def __init__(self):
        super().__init__(
            name="filter_relevant_pages",
            description="Filters UI pages based on user intent to find the most relevant page. Returns the page name or None if no page matches.",
            is_read_only=True,
            schema=PageFilterInput,
        )

        # Initialize LLM with Vultr backend
        self.llm = ChatOpenAI(
            model=settings.vultr_model,
            api_key=settings.vultr_api_key,
            base_url="https://api.vultrinference.com/v1",
            temperature=0,
        )

    def _format_pages_context(self, pages: list[dict[str, Any]]) -> str:
        """Format available pages into numbered list for LLM context."""
        if not pages:
            return "No pages available."

        formatted_lines = []
        for i, page in enumerate(pages, 1):
            # Handle both dict and PageInfo objects
            if isinstance(page, dict):
                page_name = page.get("page_name", "")
                page_desc = page.get("page_description", "")
            else:
                page_name = page.page_name
                page_desc = page.page_description

            formatted_lines.append(f"{i}. {page_name}: {page_desc}")

        return "\n".join(formatted_lines)

    async def execute(self, args: dict[str, Any]) -> dict[str, Any]:
        """Execute page filtering using LLM."""
        try:
            # Extract input
            user_requirement = args.get("user_requirement", "")
            available_pages = args.get("available_pages", [])

            # Format pages for LLM
            pages_context = self._format_pages_context(available_pages)

            # Build system prompt with explicit JSON format instruction
            system_prompt = """You are a strict page router. Your job is to evaluate if any of the available pages can fulfill the user's requirement.

CRITICAL RULES:
1. Only select a page if it is DIRECTLY relevant to the user's requirement
2. Be strict - if no page clearly matches, return null for selected_page_name
3. Do not guess or make assumptions
4. Consider the page's actual functionality, not just keyword matches
5. The user's requirement must be achievable using the page's described features

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "selected_page_name": "page_name or null",
  "reasoning": "brief explanation"
}"""

            # Build user message
            user_prompt = f"""User's requirement: {user_requirement}

Available pages:
{pages_context}

Return a JSON object with the most relevant page_name (or null if none match) and reasoning."""

            # Call LLM
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]

            response = await self.llm.ainvoke(messages)

            # Extract content and parse JSON
            content = response.content.strip()

            # Remove markdown code blocks if present
            if content.startswith("```"):
                # Remove opening ```json or ```
                content = content.split("\n", 1)[1] if "\n" in content else content[3:]
                # Remove closing ```
                if content.endswith("```"):
                    content = content.rsplit("```", 1)[0]
                content = content.strip()

            # Parse JSON
            parsed = json.loads(content)

            # Validate using Pydantic
            result = PageFilterOutput(**parsed)

            # Return dict format (executor will wrap in ToolResult)
            return {
                "selected_page_name": result.selected_page_name,
                "reasoning": result.reasoning,
            }

        except json.JSONDecodeError as e:
            raise PageFilterError(f"LLM returned invalid JSON: {str(e)}") from e
        except Exception as e:
            raise PageFilterError(f"Page filtering failed: {str(e)}") from e
