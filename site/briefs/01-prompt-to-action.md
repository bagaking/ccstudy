# Module 1: From Prompt to Action

## Teaching Arc
- **Metaphor:** Lights coming up in a theater — the stage crew doesn't flip every switch at once. They bring up only what the scene needs, and the rest stays dark until called.
- **Opening hook:** You type `claude` and hit Enter. The whole app doesn't wake up at once — it wakes up in layers, and the first layer is deliberately tiny.
- **Key insight:** The startup path is a performance optimization disguised as code structure. Cheap requests (like `--version`) pay zero import cost. The full agent only loads when you actually need it. This pattern — "lazy loading" — is everywhere in production software.
- **"Why should I care?":** When you tell an AI agent "make startup faster," you need to know *where* startup time actually lives. This module gives you the map. When something feels slow, you'll know which phase to blame.

## Screens (5)

1. **The moment you press Enter** — What happens in the first millisecond. The process starts, reads `process.argv`, and immediately asks: is this a fast-path request?
2. **The fast-path trick** — `--version` returns in microseconds with zero module loading. Walk through the code. Explain what "module loading" means (importing a file costs time — the browser equivalent is downloading a JS bundle).
3. **The startup profiler** — `CLAUDE_CODE_PROFILE_STARTUP=1` reveals the full timeline. Show the four named phases: `import_time`, `init_time`, `settings_time`, `total_time`. This is a real debugging tool you can use right now.
4. **The staged loading chain** — cli.tsx → startupProfiler → bootstrap → main.tsx → setup() + getCommands() in parallel. Each step is a named checkpoint. Draw the timeline.
5. **Why this matters for you** — When an agent feels slow to start, you now know which phase to blame. When you ask AI to "optimize startup," you can say "the `init_time` phase is slow" instead of "it feels sluggish."

## Code Snippets (pre-extracted)

### Fast-path: zero imports for `--version`
File: `claude-code-source/src/entrypoints/cli.tsx` (lines 34-48)

```ts
const args = process.argv.slice(2);

// Fast-path for --version/-v: zero module loading needed
if (args.length === 1 && (args[0] === '--version' || args[0] === '-v' || args[0] === '-V')) {
  // MACRO.VERSION is inlined at build time
  console.log(`${MACRO.VERSION} (Claude Code)`);
  return;
}

// For all other paths, load the startup profiler
const {
  profileCheckpoint
} = await import('../utils/startupProfiler.js');
profileCheckpoint('cli_entry');
```

**Plain English:** "If you only asked for the version number, we're done — no need to load anything else. For everything else, we start the timer."

### Startup profiler phase definitions
File: `claude-code-source/src/utils/startupProfiler.ts` (lines ~55-62)

```ts
const PHASE_DEFINITIONS = {
  import_time: ['cli_entry', 'main_tsx_imports_loaded'],
  init_time: ['init_function_start', 'init_function_end'],
  settings_time: ['eagerLoadSettings_start', 'eagerLoadSettings_end'],
  total_time: ['cli_entry', 'main_after_run'],
} as const
```

**Plain English:** "The profiler measures four named phases. Each phase is the time between two named checkpoints. You can see these in the startup report by setting `CLAUDE_CODE_PROFILE_STARTUP=1`."

### Parallel setup: setup() and getCommands() fire at the same time
File: `claude-code-source/src/main.tsx` (lines ~1919-1929)

```ts
// Register bundled skills/plugins before kicking getCommands() — they're
// pure in-memory array pushes (<1ms, zero I/O) that getBundledSkills()
// reads synchronously.
if (process.env.CLAUDE_CODE_ENTRYPOINT !== 'local-agent') {
  initBuiltinPlugins();
  initBundledSkills();
}
const setupPromise = setup(preSetupCwd, permissionMode, ...);
const commandsPromise = worktreeEnabled ? null : getCommands(preSetupCwd);
const agentDefsPromise = worktreeEnabled ? null : getAgentDefinitionsWithOverrides(preSetupCwd);
```

**Plain English:** "Instead of doing setup, then loading commands, then loading agent definitions one after another, the app kicks all three off at the same time. Like starting the dishwasher and the laundry simultaneously instead of waiting for one to finish."

## Interactive Elements

- [x] **Code↔English translation** — the CLI fast-path snippet, annotated line by line
- [x] **Quiz** — 3 questions: (1) scenario: "you run `claude --version` — which phase runs?" (2) tracing: "what does `profileCheckpoint('cli_entry')` do?" (3) concept: "why does `--version` load zero modules?"
- [ ] **Group chat animation** — not needed this module
- [x] **Data flow animation** — user types `claude fix bug` → cli.tsx reads args → no fast-path match → profiler starts → bootstrap loads → main.tsx runs → setup() + getCommands() fire in parallel → REPL appears
- [x] **Other** — numbered step cards for the startup timeline; callout box: "You can see this yourself: run `CLAUDE_CODE_PROFILE_STARTUP=1 claude --version` and look in `~/.claude/startup-perf/`"

## Aha! Callout Boxes

1. **"Lazy loading"** — Software loads things only when needed. The browser does this with JavaScript bundles. Claude Code does it with `await import(...)`. The pattern is universal: pay the cost only when you must.
2. **"Build-time inlining"** — `MACRO.VERSION` is not a variable that gets looked up at runtime. It's replaced with the actual version string when the app is compiled. Zero runtime cost. This is called a "compile-time constant" — the value is baked in before the program ever runs.

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Message Flow / Data Flow Animation", "Multiple-Choice Quizzes", "Callout Boxes", "Numbered Step Cards", "Pattern/Feature Cards", "Glossary Tooltips"
- `references/design-system.md` → "Color Palette", "Typography", "Module Structure"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous module:** None — this is the entry point
- **Next module:** Meet the Cast — the startup path introduces the actors; the next module names them and explains what each one does
- **Tone/style notes:** Warm, curious. The learner just ran `claude` for the first time. Make them feel like they're peeking behind a curtain, not reading a manual. Tooltip every technical term on first use. Never say "it's not X, it's Y" — say "it works like X, and here's the twist."
