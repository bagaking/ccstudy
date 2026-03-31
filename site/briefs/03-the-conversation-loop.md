# Module 3: The Conversation Loop

## Teaching Arc
- **Metaphor:** A jazz improvisation session — the lead player states a theme, the rhythm section responds, the lead incorporates what they heard and plays the next phrase. It's not a script; it's a live negotiation that ends when the song feels complete.
- **Opening hook:** You type "fix the bug in auth.ts." One message in, one message out — that's what it looks like. What actually happens is a loop: the model reads your message, decides it needs to look at a file, calls a tool, gets the result, decides it needs to run a test, calls another tool, gets that result, and *then* writes the fix. Multiple round trips, one turn.
- **Key insight:** The QueryEngine doesn't send one request to the model and wait for a final answer. It runs a loop — model responds, tools execute, results feed back in — until the model says it's done or the turn budget runs out. Understanding this loop is the key to understanding why agents get stuck, repeat themselves, or go off the rails.
- **"Why should I care?":** When an agent loops forever, calls the wrong tool, or gives up too early, the bug is somewhere in this loop. Knowing the loop means you can diagnose it.

## Screens (5)

1. **One turn, many round trips** — A single user message can trigger 5, 10, even 20 model calls before the agent responds. Show a concrete example: "fix the bug" → read file → run tests → read error → edit file → run tests again → respond.
2. **The query() function** — The heart of the loop. It takes the full conversation history, system prompt, and tool list, sends them to the model, and yields back whatever the model produces — text, tool calls, or a stop signal.
3. **Tool calls as messages** — When the model wants to call a tool, it doesn't "call" it directly. It emits a structured message saying "I want to call BashTool with these arguments." The QueryEngine reads that message, executes the tool, and appends the result as a new message. The model sees the result on the next round trip.
4. **Concurrent vs. serial tools** — Read-only tools (Glob, Grep, FileRead) run concurrently — up to 10 at once. Write tools (FileEdit, Bash) run serially. The code in `toolOrchestration.ts` partitions tool calls by safety before executing them.
5. **When the loop ends** — The model emits a `stop_reason`. Could be `end_turn` (done), `max_tokens` (hit the limit), or `tool_use` (wants another round). The QueryEngine checks `maxTurns` and `taskBudget` to decide whether to keep going or stop.

## Code Snippets (pre-extracted)

### The query() handoff: everything the model needs, in one call
File: `claude-code-source/src/QueryEngine.ts` (lines 671-686)

```ts
for await (const message of query({
  messages,          // full conversation history
  systemPrompt,      // instructions + context
  userContext,       // user-specific additions
  systemContext,     // system-level additions
  canUseTool: wrappedCanUseTool,  // permission gate
  toolUseContext: processUserInputContext,
  fallbackModel,     // backup if primary model fails
  querySource: 'sdk',
  maxTurns,          // loop budget
  taskBudget,        // token budget
})) {
```

**Plain English:** "Hand the model everything it needs — the full conversation, the rules, the tools it's allowed to use, and the budget. Then listen for what it sends back, one message at a time."

### Concurrent vs. serial tool execution
File: `claude-code-source/src/services/tools/toolOrchestration.ts` (lines ~20-55)

```ts
export async function* runTools(
  toolUseMessages: ToolUseBlock[],
  ...
): AsyncGenerator<MessageUpdate, void> {
  for (const { isConcurrencySafe, blocks } of partitionToolCalls(...)) {
    if (isConcurrencySafe) {
      // Run read-only batch concurrently (up to 10 at once)
      for await (const update of runToolsConcurrently(blocks, ...)) {
        yield { message: update.message, newContext: currentContext }
      }
    } else {
      // Run non-read-only batch serially (one at a time)
      for await (const update of runToolsSerially(blocks, ...)) {
        yield { message: update.message, newContext: currentContext }
      }
    }
  }
}
```

**Plain English:** "If the tools are just reading (safe to run in parallel), run them all at once. If they're writing or running commands (order matters), run them one at a time. This is why reading 5 files feels instant but editing them takes longer."

### Auto-compact: when the conversation gets too long
File: `claude-code-source/src/services/compact/autoCompact.ts` (lines ~30-45)

```ts
export const AUTOCOMPACT_BUFFER_TOKENS = 13_000
export const WARNING_THRESHOLD_BUFFER_TOKENS = 20_000

export function getAutoCompactThreshold(model: string): number {
  const effectiveContextWindow = getEffectiveContextWindowSize(model)
  const autocompactThreshold = effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
  return autocompactThreshold
}
```

**Plain English:** "When the conversation history gets close to the model's memory limit, the app automatically summarizes the old parts and keeps only the recent ones. This is why a long session doesn't crash — it quietly compresses its own history."

## Interactive Elements

- [x] **Code↔English translation** — the `query()` handoff snippet, annotated parameter by parameter
- [x] **Quiz** — 3 questions: (1) tracing: "the model calls FileRead and Bash in the same response — which runs first?" (2) debugging: "the agent keeps calling the same tool in a loop — what's the most likely cause?" (3) concept: "what does `maxTurns` control?"
- [x] **Group chat animation** — User → QueryEngine: "fix the bug." QueryEngine → Model: "here's the history + tools." Model → QueryEngine: "call FileRead on auth.ts." QueryEngine → FileReadTool: "read auth.ts." FileReadTool → QueryEngine: "here's the content." QueryEngine → Model: "here's what FileRead returned." Model → QueryEngine: "I see the bug, call FileEdit." QueryEngine → FileEditTool: "make this change." FileEditTool → QueryEngine: "done." QueryEngine → Model: "edit complete." Model → QueryEngine: "I'm done." QueryEngine → User: "fixed."
- [x] **Data flow animation** — user message → QueryEngine builds context → query() sends to model → model emits tool_use → QueryEngine executes tools → results appended to messages → query() sends updated messages → model emits end_turn → QueryEngine yields result
- [x] **Other** — numbered step cards for one full turn; callout box on auto-compact

## Aha! Callout Boxes

1. **"The model doesn't remember — it re-reads"** — Every round trip sends the *entire* conversation history. The model has no persistent memory between calls. What looks like "remembering" is actually re-reading everything from the start. This is why long conversations get expensive and why auto-compact exists.
2. **"Tool calls are messages, not function calls"** — The model can't directly execute code. It emits a structured JSON message saying "I want to call this tool with these arguments." The QueryEngine reads that message and does the actual execution. This separation is what makes the permission system possible.

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Group Chat Animation", "Message Flow / Data Flow Animation", "Multiple-Choice Quizzes", "Numbered Step Cards", "Callout Boxes", "Glossary Tooltips"
- `references/design-system.md` → "Color Palette", "Typography", "Module Structure"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous module:** Meet the Cast — introduced the actors; this module shows how they coordinate on a single turn
- **Next module:** Tools and the Outside World — zooms into the tools this loop can call, and what happens when they fail
- **Tone/style notes:** Keep the learner anchored to one concrete example (fixing a bug) throughout the module. Every abstract concept should map back to a step in that example. Never lose the thread.
