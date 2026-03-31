# Module 4: Tools and the Outside World

## Teaching Arc
- **Metaphor:** A surgeon who can't touch the patient directly — they call out instructions to a scrub nurse who hands them the right instrument. The surgeon decides; the nurse acts. The model decides; the tools act.
- **Opening hook:** The model can't read your files. It can't run your tests. It can't browse the web. Everything the agent *does* in the real world goes through a tool. The model is the brain; the tools are the hands.
- **Key insight:** When something goes wrong — a file isn't read, a command fails, an MCP server drops the connection — the bug is almost never in the model. It's in the tool, the connection, or the permission gate. Knowing the tool layer means you can diagnose failures at the right level.
- **"Why should I care?":** "The AI is broken" is almost never the right diagnosis. "The Bash tool timed out" or "the MCP session expired" is. This module gives you the vocabulary to say the right thing.

## Screens (5)

1. **The tool taxonomy** — Four categories: filesystem tools (Read, Edit, Write, Glob, Grep), shell tools (Bash, PowerShell), web tools (WebFetch, WebSearch), and connectors (MCPTool, AgentTool). Each category has different failure modes.
2. **How a tool call works** — The model emits a `tool_use` block with a name and arguments. The QueryEngine finds the matching tool, checks permissions, executes it, and appends the result as a `tool_result` message. The model never touches the filesystem directly.
3. **MCP: the plugin system** — MCP (Model Context Protocol) lets external servers expose their own tools. A database server can expose a `query_db` tool. A browser can expose a `click_element` tool. The agent treats them identically to built-in tools — but they live outside the process and can fail independently.
4. **MCP session expiry: a real failure mode** — MCP connections use HTTP sessions. Sessions expire. When they do, the error looks like a generic 404 — but it's actually a JSON-RPC `-32001` code embedded in the message. The code has to parse the error message to tell the difference. This is what "defensive error handling" looks like in practice.
5. **Tool description caps and timeouts** — MCP tool descriptions are capped at 2048 characters (OpenAPI-generated servers can dump 60KB of docs). Tool calls time out after ~27.8 hours by default (configurable via `MCP_TOOL_TIMEOUT`). These are real constraints that affect real integrations.

## Code Snippets (pre-extracted)

### MCP session expiry detection: parsing errors defensively
File: `claude-code-source/src/services/mcp/client.ts` (lines 193-210)

```ts
export function isMcpSessionExpiredError(error: Error): boolean {
  const httpStatus =
    'code' in error ? (error as Error & { code?: number }).code : undefined
  if (httpStatus !== 404) {
    return false
  }
  // The SDK embeds the response body text in the error message.
  // MCP servers return: {"error":{"code":-32001,"message":"Session not found"},...}
  // Check for the JSON-RPC error code to distinguish from generic web server 404s.
  return (
    error.message.includes('"code":-32001') ||
    error.message.includes('"code": -32001')
  )
}
```

**Plain English:** "A 404 error could mean 'wrong URL' or 'session expired.' We check the error message body for a specific JSON-RPC code (-32001) to tell them apart. If it's a session expiry, we can reconnect and retry. If it's a real 404, we can't."

### MCP tool description cap: protecting the context window
File: `claude-code-source/src/services/mcp/client.ts` (lines ~215-220)

```ts
/**
 * Cap on MCP tool descriptions and server instructions sent to the model.
 * OpenAPI-generated MCP servers have been observed dumping 15-60KB of endpoint
 * docs into tool.description; this caps the p95 tail without losing the intent.
 */
const MAX_MCP_DESCRIPTION_LENGTH = 2048
```

**Plain English:** "Some MCP servers send enormous tool descriptions — up to 60KB of API docs. We cap them at 2048 characters. Otherwise, a single MCP server could eat most of the model's context window just describing its tools."

### Tool concurrency cap: how many tools run at once
File: `claude-code-source/src/services/tools/toolOrchestration.ts` (lines ~10-14)

```ts
function getMaxToolUseConcurrency(): number {
  return (
    parseInt(process.env.CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY || '', 10) || 10
  )
}
```

**Plain English:** "Up to 10 read-only tools can run at the same time. You can override this with an environment variable. More concurrency means faster parallel reads; too much concurrency can overwhelm slow external systems."

## Interactive Elements

- [x] **Code↔English translation** — the MCP session expiry snippet, annotated line by line
- [x] **Quiz** — 3 questions: (1) diagnosis: "the agent says it can't read a file — is this a model problem or a tool problem?" (2) architecture: "you want to give the agent access to your database — which tool category does that fall into?" (3) debugging: "an MCP tool call returns a 404 — what are the two possible causes?"
- [x] **Group chat animation** — Model → QueryEngine: "call MCPTool: query_db with args {table: 'users'}." QueryEngine → PermissionGate: "is MCPTool allowed?" PermissionGate → QueryEngine: "yes." QueryEngine → MCPServer: "query_db({table: 'users'})." MCPServer → QueryEngine: "404 Session not found." QueryEngine → isMcpSessionExpiredError: "is this a session expiry?" isMcpSessionExpiredError → QueryEngine: "yes, code -32001." QueryEngine → MCPServer: "reconnect + retry." MCPServer → QueryEngine: "[{id: 1, name: 'Alice'}, ...]." QueryEngine → Model: "here's the result."
- [x] **Data flow animation** — model emits tool_use → QueryEngine checks permissions → tool executes → result appended as tool_result → model reads result on next round trip
- [x] **Other** — pattern cards for the four tool categories; badge list of all 40+ tools grouped by category; callout on "the model is not the bug"

## Aha! Callout Boxes

1. **"The model is not the bug"** — When an agent fails to read a file, run a command, or connect to an external service, the failure is almost always in the tool layer, not the model. Before blaming the AI, check: did the tool get called? Did it get the right arguments? Did it return an error? The model can only work with what the tools give it.
2. **"MCP is a plugin system"** — MCP (Model Context Protocol) is how you extend the agent with new capabilities. Any server that speaks the MCP protocol can expose tools to the agent. This is how Claude Code connects to databases, browsers, IDEs, and custom internal systems — without any changes to the core agent.

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Group Chat Animation", "Message Flow / Data Flow Animation", "Pattern/Feature Cards", "Permission/Config Badges", "Interactive Architecture Diagram", "Multiple-Choice Quizzes", "Callout Boxes", "Glossary Tooltips"
- `references/design-system.md` → "Color Palette", "Typography", "Module Structure"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous module:** The Conversation Loop — showed where tool calls happen in the loop; this module zooms into what those tools actually are and how they fail
- **Next module:** Permissions and Trust — explains why access to these tools is gated, and how the permission system decides what the agent is allowed to do
- **Tone/style notes:** Make the model feel smaller and the tools feel concrete. Every abstract concept should have a real failure mode attached to it. The learner should finish this module thinking "oh, so when X breaks, I check Y."
