# Module 6: Speed Tricks and Debugging

## Teaching Arc
- **Metaphor:** A film editor who works on multiple scenes simultaneously — while the color grader finishes scene 3, the sound mixer is already on scene 5, and the VFX team is rendering scene 7. Nothing waits for anything it doesn't have to.
- **Opening hook:** Claude Code feels fast because it does several things at once and defers everything it can. The startup path, the tool execution, the context management — all of it is orchestrated to minimize waiting. And when something goes wrong, the app has been recording the whole time.
- **Key insight:** Performance in software almost never comes from one magic optimization. It comes from identifying what can run in parallel, what can be deferred, and what can be cached — and then doing all three systematically. Claude Code does all three.
- **"Why should I care?":** When you ask AI to "make this faster," you need to know which kind of slowness you're dealing with. Startup slowness, turn slowness, and context-window slowness each have different fixes. This module gives you the diagnostic vocabulary.

## Screens (5)

1. **Parallel startup: three things at once** — `setup()`, `getCommands()`, and `getAgentDefinitionsWithOverrides()` all fire simultaneously. The comment in the code explains exactly why: setup's 28ms is mostly socket binding (not disk I/O), so it doesn't contend with the file reads in getCommands. This is the kind of reasoning that turns 80ms into 28ms.
2. **The startup profiler: your timing tool** — `CLAUDE_CODE_PROFILE_STARTUP=1` writes a full timeline to `~/.claude/startup-perf/`. Each checkpoint is named. You can see exactly which phase is slow. This is a real tool, not a demo — use it.
3. **File checkpointing: undo for the agent** — Every time the agent edits a file, it saves a snapshot. Up to 100 snapshots per session. If the agent makes a mess, you can roll back to any checkpoint. The snapshots live in `~/.claude/` and are keyed by message UUID.
4. **Auto-compact: managing the context window** — When the conversation history approaches the model's memory limit, the app automatically summarizes the old parts. The threshold is `contextWindow - 13,000 tokens`. After 3 consecutive failures, the circuit breaker trips and stops retrying. This prevents a bad session from burning thousands of API calls.
5. **Debugging heuristics: where to look first** — Startup slow? Check `startup-perf/`. Turn slow? Check if tools are running serially when they could be parallel. Agent looping? Check `maxTurns` and `taskBudget`. Agent forgetting context? Check if auto-compact fired. Each symptom has a specific place to look.

## Code Snippets (pre-extracted)

### Parallel startup: setup() and getCommands() fire simultaneously
File: `claude-code-source/src/main.tsx` (lines ~1919-1932)

```ts
// Register bundled skills/plugins before kicking getCommands() — they're
// pure in-memory array pushes (<1ms, zero I/O) that getBundledSkills()
// reads synchronously. Previously ran inside setup() after ~20ms of
// await points, so the parallel getCommands() memoized an empty list.
if (process.env.CLAUDE_CODE_ENTRYPOINT !== 'local-agent') {
  initBuiltinPlugins();
  initBundledSkills();
}
const setupPromise = setup(preSetupCwd, permissionMode, ...);
const commandsPromise = worktreeEnabled ? null : getCommands(preSetupCwd);
const agentDefsPromise = worktreeEnabled ? null : getAgentDefinitionsWithOverrides(preSetupCwd);

// Suppress transient unhandledRejection if these reject during the
// ~28ms setupPromise await before Promise.all joins them below.
commandsPromise?.catch(() => {});
agentDefsPromise?.catch(() => {});
await setupPromise;
```

**Plain English:** "Start setup, commands loading, and agent definitions loading all at the same time. Don't wait for setup to finish before starting the others. The comment explains why this is safe: setup is doing socket work (not disk work), so it won't compete with the file reads."

### Auto-compact threshold: when the summarizer kicks in
File: `claude-code-source/src/services/compact/autoCompact.ts` (lines ~30-50)

```ts
export const AUTOCOMPACT_BUFFER_TOKENS = 13_000
// Stop trying autocompact after this many consecutive failures.
// BQ 2026-03-10: 1,279 sessions had 50+ consecutive failures (up to 3,272)
// in a single session, wasting ~250K API calls/day globally.
const MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3

export function getAutoCompactThreshold(model: string): number {
  const effectiveContextWindow = getEffectiveContextWindowSize(model)
  return effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
}
```

**Plain English:** "When the conversation is 13,000 tokens away from the model's limit, auto-compact fires. It summarizes the old history and keeps only the recent parts. If it fails 3 times in a row, it stops trying — a real incident showed 1,279 sessions burning 250K API calls/day on failed compactions."

### File checkpointing: snapshots keyed by message
File: `claude-code-source/src/utils/fileHistory.ts` (lines ~40-60)

```ts
const MAX_SNAPSHOTS = 100

export type FileHistorySnapshot = {
  messageId: UUID       // which message triggered this snapshot
  trackedFileBackups: Record<string, FileHistoryBackup>  // file → backup
  timestamp: Date
}

export function fileHistoryEnabled(): boolean {
  return (
    getGlobalConfig().fileCheckpointingEnabled !== false &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING)
  )
}
```

**Plain English:** "Every time the agent edits a file, it saves a backup keyed to the message that triggered the edit. Up to 100 snapshots. If the agent makes a mess, you can roll back to any point in the session. Disable it with `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING=1` if you're on a slow disk."

## Interactive Elements

- [x] **Code↔English translation** — the parallel startup snippet, annotated with timing context (setup = 28ms socket binding, getCommands = file reads, why they don't contend)
- [x] **Quiz** — 3 questions: (1) diagnosis: "startup feels slow — what's the first thing you check?" (2) architecture: "the agent edited 5 files and broke everything — how do you roll back?" (3) concept: "auto-compact fired mid-session — what does the agent 'remember' afterward?"
- [x] **Group chat animation** — Startup sequence: main.tsx → initBuiltinPlugins (instant, in-memory). main.tsx → setup() (28ms, socket binding). main.tsx → getCommands() (file reads, parallel with setup). main.tsx → getAgentDefinitions() (file reads, parallel with setup). setup() → main.tsx: "done." getCommands() → main.tsx: "done." getAgentDefinitions() → main.tsx: "done." main.tsx → REPL: "ready."
- [x] **Data flow animation** — user message → QueryEngine builds context → checks token count → if near limit: auto-compact fires → summarize old history → append summary → continue with fresh context
- [x] **Other** — pattern cards for the three performance techniques (parallel, deferred, cached); visual file tree of `~/.claude/` showing where startup-perf, file checkpoints, and session transcripts live; callout on the auto-compact circuit breaker

## Aha! Callout Boxes

1. **"Parallelism is free money"** — When two operations don't depend on each other's results, running them simultaneously costs nothing extra and saves real time. The startup path does this with setup + commands + agent definitions. When you ask AI to optimize something, the first question is always: "what can run in parallel?"
2. **"The app has been recording the whole time"** — Session transcripts, file checkpoints, startup profiles, in-memory error logs — Claude Code keeps receipts. When something goes wrong, the evidence is already there. You don't need to reproduce the bug; you need to find the right log file.

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Group Chat Animation", "Message Flow / Data Flow Animation", "Pattern/Feature Cards", "Visual File Tree", "Multiple-Choice Quizzes", "Callout Boxes", "Glossary Tooltips"
- `references/design-system.md` → "Color Palette", "Typography", "Module Structure"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous module:** Permissions and Trust — explained the safety gates; this module shows how the app stays fast while those gates are active
- **Next module:** Context Engineering — shifts from performance symptoms to context construction and token-budget control
- **Tone/style notes:** Close the performance chapter with concrete debugging moves, then naturally bridge to context architecture as the next control surface.
