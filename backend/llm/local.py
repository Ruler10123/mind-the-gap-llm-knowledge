"""Local HuggingFace causal-LM chat model.

Mirrors the minimal interface LangGraph + our agent expects:
    .bind_tools(tools) -> self          # tools are ignored (no native FC)
    .invoke(messages)  -> AIMessage     # one round-trip generation

Lazy-imports `transformers` / `torch` so the app boots without them.
Install: `uv sync --extra local`  (or `uv pip install transformers accelerate`)
"""

from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage, BaseMessage

from config import settings
from observability.logger import logger


def _messages_to_chat(messages: list[BaseMessage]) -> list[dict[str, str]]:
    """Convert LangChain messages to HF chat-template dicts."""
    out: list[dict[str, str]] = []
    for m in messages:
        role = {
            "system": "system",
            "human": "user",
            "ai": "assistant",
            "tool": "tool",
        }.get(getattr(m, "type", ""), "user")
        content = m.content if isinstance(m.content, str) else str(m.content)
        out.append({"role": role, "content": content})
    return out


class LocalChatModel:
    """Thin LangGraph-compatible wrapper around a local HF causal LM."""

    def __init__(self) -> None:
        self._tokenizer = None
        self._model = None
        self._device = None
        self._tools_warned = False

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return
        try:
            import torch  # noqa: F401
            from transformers import AutoModelForCausalLM, AutoTokenizer
        except Exception as e:
            raise RuntimeError(
                "Local LLM provider requires `transformers` and `torch`. "
                "Install with `uv sync --extra local` or "
                "`uv pip install transformers accelerate`."
            ) from e

        import torch

        model_id = settings.local_model_id
        device_pref = settings.local_model_device

        if device_pref == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            device = device_pref

        logger.info(f"[LocalLLM] Loading {model_id} on device={device}")
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype="auto",
        )
        model.to(device)
        model.eval()

        self._tokenizer = tokenizer
        self._model = model
        self._device = device
        logger.info(f"[LocalLLM] {model_id} ready")

    def bind_tools(self, tools: list[Any]) -> "LocalChatModel":
        if tools and not self._tools_warned:
            logger.warning(
                "[LocalLLM] Tool binding requested but local provider has no "
                "native function-calling. Tools will be ignored — the model "
                "will reply with plain text only. Use llm_provider=vultr|openai "
                "for tool-calling, or set experiment_mode=base_only."
            )
            self._tools_warned = True
        return self

    def invoke(self, messages: list[BaseMessage], **_: Any) -> AIMessage:
        self._ensure_loaded()
        assert self._tokenizer is not None and self._model is not None

        chat = _messages_to_chat(messages)
        try:
            prompt = self._tokenizer.apply_chat_template(
                chat, tokenize=False, add_generation_prompt=True
            )
        except Exception:
            # Fallback: simple role-prefixed concatenation
            prompt = "\n".join(f"{m['role']}: {m['content']}" for m in chat) + "\nassistant:"

        inputs = self._tokenizer(prompt, return_tensors="pt").to(self._device)
        do_sample = settings.local_model_temperature > 0.0
        gen_kwargs: dict[str, Any] = {
            "max_new_tokens": settings.local_model_max_new_tokens,
            "do_sample": do_sample,
        }
        if do_sample:
            gen_kwargs["temperature"] = settings.local_model_temperature

        import torch

        with torch.no_grad():
            output_ids = self._model.generate(**inputs, **gen_kwargs)
        new_tokens = output_ids[0, inputs["input_ids"].shape[1]:]
        text = self._tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        return AIMessage(content=text)
