# Phase 01: Codebase Cleanup

## Purpose

This repo was cloned from a hackathon airport kiosk project. It is now being repurposed into an experimental harness for comparing ways of adding domain knowledge to LLM applications.

The main research question:

> For a domain-specific assistant, when should knowledge live outside the model through retrieval, inside the model through adaptation, or around the model through guardrails?

## Preserve

The project should still feel like an airport kiosk assistant.

Preserve:
- React frontend
- 3D assistant visualization
- voice/audio experience where possible
- text input fallback
- FastAPI backend
- WebSocket streaming contract
- TTS/audio streaming where possible
- basic agent/tool orchestration

## Remove or Isolate

Remove or isolate features that distract from the experiment:
- facial embeddings
- DeepFace
- MongoDB Atlas face recognition
- Vultr-specific inference client
- hardcoded external services
- private API key requirements for basic startup

## Target State

After this phase:
- The app can run in local/dev mode without MongoDB, Vultr, or face recognition.
- LLM provider is behind a swappable interface.
- RAG is behind a swappable interface.
- TTS is optional/configurable.
- External API keys are only needed for optional enhanced features.
- The repo has clear documentation for what changed.

## Not In Scope

Do not implement:
- NeMo Curator
- NeMo Evaluator
- LoRA/PEFT
- continued pretraining
- NIM deployment
- final RAG benchmark

Those come in later phases.