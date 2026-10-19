# RAG evaluation report

## Run

| Field | Value |
|---|---|
| Created (UTC) | 2026-10-19T02:11:46+00:00 |
| Git commit | 1ef4f17b01ed88a717c6020035ff6275b860b4a4 |
| Dataset | `eval/dev/rag_dev.jsonl` |
| Dataset sha256 | `357a83033f2b1fc0` |
| Corpus sha256 | `c299aa9702c11857` |
| Retriever | local_keyword (answer context top_k=5) |
| Systems | rag, base_only |
| LLM | openai / qwen/qwen3.8-27b @ 127.0.0.1:1234 |
| Temperature | 0 |

## Retrieval

Answerable cases: 38. Relevance is binary against `source_ids`.

| Metric | @1 | @3 | @5 |
|---|---|---|---|
| Hit | 0.579 | 0.789 | 0.868 |
| Recall | 0.553 | 0.697 | 0.789 |
| Precision | 0.579 | 0.263 | 0.179 |
| nDCG | 0.579 | 0.650 | 0.690 |

MRR: 0.686

### Retrieval by category

| Category | n | Hit@1 | Hit@5 | Recall@5 | MRR |
|---|---|---|---|---|---|
| assistance | 6 | 0.500 | 1.000 | 0.833 | 0.750 |
| baggage | 5 | 0.600 | 0.800 | 0.800 | 0.667 |
| facilities | 6 | 0.500 | 0.833 | 0.750 | 0.597 |
| flight_info | 6 | 0.333 | 0.833 | 0.750 | 0.472 |
| security | 5 | 1.000 | 1.000 | 0.900 | 1.000 |
| services | 5 | 0.600 | 0.600 | 0.600 | 0.600 |
| transport | 5 | 0.600 | 1.000 | 0.900 | 0.767 |

### Retrieval by difficulty

| Difficulty | n | Hit@1 | Hit@5 | Recall@5 | MRR |
|---|---|---|---|---|---|
| lexical | 17 | 0.882 | 1.000 | 1.000 | 0.926 |
| multi_hop | 6 | 0.167 | 1.000 | 0.583 | 0.500 |
| paraphrase | 15 | 0.400 | 0.667 | 0.633 | 0.489 |

### Top-1 retrieval score (keyword overlap)

Unanswerable questions scoring as high as answerable ones means a score threshold alone can't make the system refuse.

| Cases | n | min | p50 | mean | max |
|---|---|---|---|---|---|
| answerable | 38 | 1.000 | 4.000 | 3.684 | 7.000 |
| unanswerable | 9 | 1.000 | 3.000 | 3.111 | 5.000 |

### Retrieval misses (no gold section in top 5)

| Case | Gold | Retrieved top 5 |
|---|---|---|
| bag-003 | airport_faq#lost-baggage | airport_faq#carry-on-baggage, airport_faq#gate-information, airport_faq#wheelchair-service, airport_faq#service-animals, airport_faq#rideshare |
| svc-002 | airport_faq#currency-exchange | airport_faq#precheck, airport_faq#lounges, airport_faq#checked-baggage, airport_faq#tsa-screening, airport_faq#international-travel |
| svc-003 | airport_faq#charging-stations | airport_faq#lost-baggage, airport_faq#parking, airport_faq#checked-baggage, airport_faq#tsa-screening, airport_faq#precheck |
| fac-003 | airport_faq#pet-relief-areas | airport_faq#service-animals, airport_faq#precheck, airport_faq#international-travel, airport_faq#help-desk, airport_faq#parking |
| fli-002 | airport_faq#check-in | airport_faq#service-animals, airport_faq#rideshare, airport_faq#carry-on-baggage, airport_faq#gate-information, airport_faq#wheelchair-service |

## Answer quality

| System | n | Accuracy | Key-fact recall | Token F1 | Refusal recall | False refusals | Hallucination proxy | Groundedness proxy |
|---|---|---|---|---|---|---|---|---|
| rag | 47 | 0.787 | 0.763 | 0.607 | 1.000 | 0.158 | 0.000 | 0.873 |
| base_only | 47 | 0.468 | 0.539 | 0.263 | 0.333 | 0.026 | 0.255 | - |

### Latency (ms)

| System | Gen p50 | Gen p95 | Retrieval p50 | Retrieval p95 | Total p50 | Total p95 |
|---|---|---|---|---|---|---|
| rag | 15109.081 | 32985.437 | 1.542 | 2.238 | 15111.381 | 32986.500 |
| base_only | 24292.175 | 42693.829 | - | - | 24292.175 | 42693.829 |

### Accuracy by category

| Category | rag | base_only |
|---|---|---|
| assistance | 0.667 | 0.667 |
| baggage | 0.857 | 0.429 |
| facilities | 0.750 | 0.250 |
| flight_info | 0.714 | 0.857 |
| out_of_scope | 1.000 | 1.000 |
| security | 1.000 | 0.800 |
| services | 0.750 | 0.250 |
| transport | 0.800 | 0.000 |

### Worst cases: rag (10 incorrect)

| Case | Question | Answer | Why |
|---|---|---|---|
| bag-003 | My suitcase never showed up on the carousel. What should I do? | I don't have that information. | refused an answerable question |
| fac-003 | Where can my dog go to the bathroom after security? | Pet relief areas are available after security. | key facts 0.00 |
| fli-002 | How long before takeoff do they start letting people on the plane? | I don't have that information. | refused an answerable question |
| mh-002 | Where can I find someone who speaks Spanish to give me directions? | I don't have that information. | refused an answerable question |
| mh-004 | I need to return my rental car and then take the train. Where do I drop the car… | I don't have that information. | refused an answerable question |

### Worst cases: base_only (25 incorrect)

| Case | Question | Answer | Why |
|---|---|---|---|
| una-002 | How much does a lounge day pass cost? | Lounge day pass prices vary by airport and specific lounge, but they typically range from $35 to $100. Please tell me which airport and lou… | answered an unanswerable question |
| una-003 | Is there a smoking area in the terminal? | It depends on your specific airport. Most airports have designated smoking areas, usually located outdoors or in specific enclosed rooms. P… | answered an unanswerable question |
| una-005 | What time does the pharmacy close? | I would be happy to help, but I need to know which airport and which pharmacy you are asking about. | answered an unanswerable question |
| una-006 | Can I bring a drone in my carry-on? | Yes. You can bring a drone in your carry-on. Keep any removable or spare lithium batteries in your carry-on, and make sure the drone is tur… | answered an unanswerable question |
| una-007 | How much does it cost to check a second bag in economy? | The cost to check a second bag in economy varies depending on the airline and your destination. For domestic flights in the US, it typicall… | answered an unanswerable question |
