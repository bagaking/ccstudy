# Module 12: Proactive, Background, and Scheduled Agents

## Teaching Arc
- **Metaphor:** One command fabric, three autonomous clocks.
- **Opening hook:** Agent autonomy is not one feature toggle. It is a set of runtime paths that must share routing rules and safety boundaries.
- **Key insight:** Proactive ticks, background sessions, and scheduled tasks all enqueue work, but differ in ownership, visibility, and execution environment.
- **Why should I care?** This is where silent production bugs happen: wrong queue target, leaked system messages, duplicate cron firing, or mixed transcript ownership.

## Core Source References
- `source/claude-code-source/src/main.tsx`
- `source/claude-code-source/src/query.ts`
- `source/claude-code-source/src/screens/REPL.tsx`
- `source/claude-code-source/src/cli/print.ts`
- `source/claude-code-source/src/entrypoints/agentSdkTypes.ts`
- `source/claude-code-source/src/tasks/LocalMainSessionTask.ts`
- `source/claude-code-source/src/hooks/useScheduledTasks.ts`
- `source/claude-code-source/src/skills/bundled/scheduleRemoteAgents.ts`

## Source Coverage Added
- **Proactive startup + tick lifecycle**
  - `main.tsx`: proactive activation before `getTools()`, proactive prompt injection, coordinator mode exclusion.
  - `print.ts`: `scheduleProactiveTick()` logic and idle-queue trigger.
- **Scheduled task plumbing (REPL + headless)**
  - `REPL.tsx`: `useScheduledTasks` mounting in AGENT_TRIGGERS path.
  - `useScheduledTasks.ts`: `onFireTask` routing (`agentId` teammate vs lead), `isMeta`, `WORKLOAD_CRON`, orphan cleanup.
  - `query.ts`: per-agent queue-drain filtering for main thread vs subagent.
  - `agentSdkTypes.ts`: `watchScheduledTasks`, `ScheduledTaskEvent`, lock-aware scheduler contract.
  - `print.ts`: headless cron scheduler wiring in SDK/`-p` mode.
- **Background main-session execution model**
  - `LocalMainSessionTask.ts`: isolated transcript symlink, task state registration, `runWithAgentContext` subagent scoping.
- **Remote scheduled agents surface**
  - `scheduleRemoteAgents.ts`: `/schedule` skill contract, policy gating, remote trigger tool semantics.

## Screens
1. One runtime, three autonomy loops (proactive / background / cron)
2. Proactive activation order and tick sustain loop
3. Scheduled task routing in REPL + queue scoping in query loop
4. Background session isolation and task-scoped transcript behavior
5. Local cron scheduler vs remote scheduled agents (`/schedule`) boundary
6. Quiz: routing, activation order, and local-vs-remote scheduling decisions

## Required Interactive Elements
- 3 code-to-plain-language translation blocks per language
- 1 architecture/pattern framing screen per language
- 1 quiz per language (3 questions each)

## Notes
- No files are present under `source/claude-code-source/src/proactive/` in this snapshot. Proactive behavior coverage is sourced from `main.tsx`, `print.ts`, and `REPL.tsx` paths that call proactive modules.
- Chinese copy style is direct and technical, focused on execution boundaries and debugging decisions.
