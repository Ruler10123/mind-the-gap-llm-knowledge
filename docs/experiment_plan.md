Question:
When should domain knowledge be added through retrieval versus model adaptation?

Domain:
Airport kiosk assistant.

Base model:
One chosen open model, kept constant across experiments.

Knowledge corpus:
Airport-related docs, FAQs, synthetic gate information, policy snippets.

Compared systems:
1. Base model only
2. RAG
3. RAG + Guardrails
4. LoRA/PEFT
5. Optional continued pretraining

Metrics:
Accuracy, groundedness, hallucination rate, refusal correctness, latency.