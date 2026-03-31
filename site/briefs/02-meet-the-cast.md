# Module 2: Meet the Cast

## Teaching Arc
- **Metaphor:** A kitchen brigade — the head chef doesn't cook every dish. There's a prep cook, a line cook, a saucier, a plating station. Each person owns one domain and hands off to the next.
- **Opening hook:** Claude Code feels like one smart assistant. Under the hood, it's a team of specialists — each one owns a specific job and hands work to the next. Once you know who's who, you can tell AI exactly where a change belongs.
- **Key insight:** Every confusing "where does this go?" question in software has the same answer: find the actor whose job description matches the change. Architecture is just a map of responsibilities.
- **"Why should I care?":** When you ask an AI to "add a feature," it needs to know which file to touch. If you can say "put this in the QueryEngine, not the REPL," you get better results and fewer surprises.

## Screens (5)

1. **The illusion of one assistant** — The user sees a single prompt. The code sees five distinct actors passing a baton. Introduce the cast by name.
2. **The CLI entrypoint** — `cli.tsx` is the front door. It reads your command, decides which path to take, and hands off. It doesn't do the work — it routes.
3. **The REPL and App shell** — `REPL.tsx` is the interactive loop you see on screen. `App.tsx` wraps it with global state (theme, permissions, session). They're separate because the display layer and the logic layer have different jobs.
4. **The QueryEngine** — The brain. It takes your message, builds the full context (system prompt + history + tools), calls the model, and orchestrates what happens with the response. This is where "one turn" lives.
5. **The toolbelt** — 40+ tools in `src/tools/`. Each one is a specialist: BashTool runs shell commands, FileReadTool reads files, MCPTool talks to external servers. The QueryEngine calls them; they don't call each other.

## Code Snippets (pre-extracted)

### The REPL launcher: lazy-loading the display layer
File: `claude-code-source/src/replLauncher.tsx` (lines 12-21)

```tsx
export async function launchRepl(
  root: Root,
  appProps: AppWrapperProps,
  replProps: REPLProps,
  renderAndRun: (root: Root, element: React.ReactNode) => Promise<void>
): Promise<void> {
  const { App } = await import('./components/App.js');
  const { REPL } = await import('./screens/REPL.js');
  await renderAndRun(root, <App {...appProps}><REPL {...replProps} /></App>);
}
```

**Plain English:** "Load the visual shell (App) and the interactive loop (REPL) only when we're actually going to show them. Then nest REPL inside App — the outer wrapper handles global concerns, the inner one handles the conversation."

### The tool directory: 40+ specialists, each in its own folder
File: `claude-code-source/src/tools/` (directory listing)

```
BashTool/         ← runs shell commands
FileReadTool/     ← reads files
FileEditTool/     ← edits files
GlobTool/         ← finds files by pattern
GrepTool/         ← searches file contents
MCPTool/          ← talks to external MCP servers
AgentTool/        ← spawns sub-agents
WebFetchTool/     ← fetches web pages
WebSearchTool/    ← searches the web
TaskCreateTool/   ← creates tasks in the task list
... (30+ more)
```

**Plain English:** "Each tool is its own folder with its own logic. The QueryEngine picks which tools to offer the model. The model decides which ones to call. The tools do the actual work."

### The QueryEngine: where one turn lives
File: `claude-code-source/src/QueryEngine.ts` (lines 671-686)

```ts
for await (const message of query({
  messages,
  systemPrompt,
  userContext,
  systemContext,
  canUseTool: wrappedCanUseTool,
  toolUseContext: processUserInputContext,
  fallbackModel,
  querySource: 'sdk',
  maxTurns,
  taskBudget,
})) {
```

**Plain English:** "The QueryEngine hands everything to `query()` — the full conversation history, the system prompt, the list of available tools, and the budget for how many turns to allow. Then it listens for what comes back."

## Interactive Elements

- [x] **Code↔English translation** — the `launchRepl` snippet, annotated
- [x] **Quiz** — 3 questions: (1) ownership: "the agent reads a file — which actor does the actual reading?" (2) architecture: "you want to change how the model is called — which file do you touch?" (3) concept: "why are App and REPL separate components?"
- [x] **Group chat animation** — CLI entrypoint messages bootstrapper: "I got a prompt, spin up the REPL." Bootstrapper messages App: "Wrap the REPL in global state." App messages REPL: "You're live." REPL messages QueryEngine: "User said: fix the bug." QueryEngine messages BashTool: "Run this command." BashTool replies: "Done, here's the output."
- [ ] **Data flow animation** — covered by group chat
- [x] **Other** — interactive architecture diagram showing the five actors and their connections; visual file tree of `src/` with actors highlighted; callout box on "separation of concerns"

## Aha! Callout Boxes

1. **"Separation of concerns"** — Each actor does one thing. This sounds obvious, but it's the most important principle in software design. When things go wrong, you know exactly where to look. When you want to add something, you know exactly where it goes.
2. **"The model doesn't run tools"** — The model *requests* tool calls. The QueryEngine *executes* them. This distinction matters: if a tool fails, it's not the model's fault. If the model picks the wrong tool, that's a different problem entirely.

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Group Chat Animation", "Interactive Architecture Diagram", "Visual File Tree", "Multiple-Choice Quizzes", "Callout Boxes", "Glossary Tooltips"
- `references/design-system.md` → "Color Palette", "Typography", "Module Structure"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous module:** From Prompt to Action — showed the startup path that assembles this cast
- **Next module:** The Conversation Loop — traces how these actors coordinate on a single prompt, turn by turn
- **Tone/style notes:** Give each actor a personality, not just a job title. The CLI is the doorman. The QueryEngine is the conductor. The tools are the musicians. Make the architecture feel alive.
