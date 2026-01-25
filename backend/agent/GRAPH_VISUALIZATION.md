# LangGraph Workflow Visualization

## Core Graph Structure

![Core Graph Structure](graphs/01_core_structure.png)

## Detailed Workflow with State

![Detailed Workflow](graphs/02_detailed_workflow.png)

## Orchestrator Wrapper with Retry Logic

![Orchestrator Flow](graphs/03_orchestrator.png)

## Available Tools

![Available Tools](graphs/04_tools.png)

## State Schema

![State Schema](graphs/05_state_schema.png)

## Complete Flow with Examples

![Sequence Example](graphs/06_sequence_example.png)

## Key Components

### 1. **Graph Nodes**

- **`llm_call`**: 
  - Prepends `SystemMessage` with tool descriptions
  - Invokes LLM (Vultr API) with tools bound
  - Returns `AIMessage` (may contain `tool_calls`)
  - Tracks `llm_calls` counter

- **`tool_node`**:
  - Extracts `tool_calls` from last `AIMessage`
  - Executes each tool function
  - Returns `ToolMessage(s)` with results
  - Handles JSON serialization for dict results

### 2. **Conditional Routing**

- **`should_continue`**: 
  - Checks if last message is `AIMessage` with `tool_calls`
  - Routes to `tool_node` if tools needed
  - Routes to `END` if response is complete

### 3. **Orchestrator Layer**

- Wraps graph execution with retry logic
- Streams events to frontend (ComponentEvent, UIActionEvent, text)
- Handles errors and feeds them back to LLM for self-correction
- Buffers component events to yield before text

### 4. **Retry Strategy**

- **LLMParseError**: Always retries (safe, no side effects)
- **ToolExecutionError**: No retry (tools are simple, deterministic)
- **Max retries**: Configurable via `agent_max_retries` (default: 3)

## Tool Execution Flow

![Tool Execution Flow](graphs/07_tool_execution.png)

## Error Handling Flow

![Error Handling Flow](graphs/08_error_handling.png)
