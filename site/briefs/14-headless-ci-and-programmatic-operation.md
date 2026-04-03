# Module 14: Headless, CI, and Programmatic Operation

## Teaching Arc
- **Metaphor:** A typed automation protocol, not a terminal conversation.
- **Opening hook:** `claude -p` looks simple, but production-safe automation depends on strict contracts for I/O framing, structured output, and recoverable session state.
- **Key insight:** Headless operation is built from composable guarantees: format validation, ordered control messaging, bounded retries, explicit resume semantics, and measurable failure paths.
- **Why should I care?** This is where CI incidents happen: broken NDJSON, hidden stdout noise, unbounded retries, wrong resume source, or non-deterministic exit behavior.

## Core Source References
- `source/claude-code-source/src/main.tsx`
- `source/claude-code-source/src/cli/print.ts`
- `source/claude-code-source/src/cli/structuredIO.ts`
- `source/claude-code-source/src/tools/SyntheticOutputTool/SyntheticOutputTool.ts`
- `source/claude-code-source/src/utils/headlessProfiler.ts`
- `source/claude-code-source/src/entrypoints/agentSdkTypes.ts`
- `source/claude-code-source/src/services/api/claude.ts`
- `source/claude-code-source/src/QueryEngine.ts`

## Source Coverage Added
- **Headless entry and flag contract**
  - `main.tsx`: `--print` option semantics, input/output format validation, SDK URL auto-format behavior, print-mode branch into `runHeadless(...)`.
  - `print.ts`: `stream-json` requiring `--verbose`, input requirements for print mode, early validation for resume-dependent flags.
- **Stream-json protocol and CI-safe stdout handling**
  - `print.ts`: `installStreamJsonStdoutGuard()` before first structured write, output error handling, process output error handlers.
  - `structuredIO.ts`: NDJSON write path, single outbound queue ordering (`outbound` stream), control request/response handling, duplicate response suppression.
- **Structured output contract**
  - `main.tsx`: `--json-schema` path and synthetic tool injection after base tool filtering.
  - `SyntheticOutputTool.ts`: `StructuredOutput` tool definition, Ajv schema validation, identity-based schema cache.
  - `QueryEngine.ts`: structured-output enforcement registration and max-retry termination (`error_max_structured_output_retries`).
  - `claude.ts`: API `output_config.format` merge and structured-output beta header wiring.
- **Resume/continue/fork behavior in headless mode**
  - `print.ts`: `--continue` latest-session load, `--resume` explicit session parse/load, `--resume-session-at` slicing, `--fork-session` ID policy, `--rewind-files` constraints.
  - `main.tsx`: `--session-id` conflict rule with continue/resume unless forking.
- **Observability and runtime safety**
  - `headlessProfiler.ts`: per-turn checkpoint model for headless latency.
  - `claude.ts`: stream watchdog idle timeout and no-event stream failure detection.
  - `agentSdkTypes.ts`: programmatic session/query surface references for host orchestration.

## Screens
1. Execution map: four automation contracts (`--print`, stream-json, structured output, resume semantics)
2. `--print` and format coupling rules (validation-first behavior)
3. Stream-json protocol integrity (stdout guard + ordered control messaging)
4. Structured output lifecycle (tool injection, Ajv validation, retry limit)
5. Resume/continue/fork/session-cursor semantics in print mode
6. CI-safe operation patterns (deterministic output, explicit failure, profiling/watchdog)
7. Quiz: format validation, structured retry cap, resume semantics

## Required Interactive Elements
- 4 code-to-plain-language translation blocks per language
- 1 architecture framing screen per language
- 1 quiz per language (3 questions each)

## Notes
- Chinese copy is direct and technical, avoids rhetorical contrast patterns, and keeps focus on execution semantics and failure boundaries.
- Module includes required topic coverage: `--print`, `stream-json`, structured output, resume/continue behavior, and CI-safe operational patterns.
