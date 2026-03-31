# Module 5: Permissions and Trust

## Teaching Arc
- **Metaphor:** A contractor working in your house — you give them a key to the front door, but you don't give them the combination to your safe. You scope the access to the job. The permission system is how Claude Code scopes access to the task.
- **Opening hook:** The agent can edit any file, run any shell command, and connect to any server. That's the power. The permission system is what makes that power usable without being terrifying.
- **Key insight:** Permissions aren't a safety theater — they're a precision instrument. The system distinguishes between "allow `git status`" and "allow all git commands" and "allow all shell commands." The difference between those three rules is the difference between a useful workflow and a security hole.
- **"Why should I care?":** Every time you configure an AI workflow, you're making permission decisions. Understanding how the rules work means you can write rules that are tight enough to be safe and loose enough to be useful — and you'll know exactly why a confirmation screen appears when it does.

## Screens (5)

1. **The four permission modes** — `default` (ask for everything), `acceptEdits` (auto-approve file edits), `bypassPermissions` (auto-approve everything), `plan` (read-only, no execution). Each mode is a different trust level for a different context.
2. **How rules are matched** — Rules live in `.claude/settings.json`. A rule like `Bash(git status)` allows exactly that command. `Bash(git:*)` allows any git command. `Bash(*)` allows everything. The matcher checks exact match, prefix syntax, and wildcard syntax in that order.
3. **Dangerous patterns: what gets stripped in auto mode** — Auto mode has a classifier that evaluates each command. But some allow-rules are so broad they'd bypass the classifier entirely. Rules like `Bash(python:*)` or `Bash(node:*)` let the model run arbitrary code through an interpreter — so they're stripped at auto-mode entry.
4. **The dangerous patterns list** — The full list of patterns that trigger the "dangerous" flag: `python`, `node`, `bash`, `sh`, `eval`, `exec`, `sudo`, `ssh`, `curl`, `wget`, `git`, `kubectl`, `aws`, `gcloud`, and more. These aren't banned — they're just not auto-allowed.
5. **Reading a permission denial** — When the agent asks for confirmation, the message tells you exactly which rule would need to exist to auto-approve it. That's the system telling you how to configure it. You can either approve once, add the rule, or decide the agent shouldn't be doing that at all.

## Code Snippets (pre-extracted)

### The dangerous Bash rule check: what makes a rule too broad
File: `claude-code-source/src/utils/permissions/permissionSetup.ts` (lines 98-130)

```ts
export function isDangerousBashPermission(
  toolName: string,
  ruleContent: string | undefined,
): boolean {
  if (toolName !== BASH_TOOL_NAME) return false

  // Tool-level allow (Bash with no content, or Bash(*)) - allows ALL commands
  if (ruleContent === undefined || ruleContent === '') return true

  const content = ruleContent.trim().toLowerCase()

  // Standalone wildcard (*) matches everything
  if (content === '*') return true

  // Check for dangerous patterns with prefix syntax (e.g., "python:*")
  // or wildcard syntax (e.g., "python*")
  for (const pattern of DANGEROUS_BASH_PATTERNS) {
    const lowerPattern = pattern.toLowerCase()
    if (content === lowerPattern) return true          // exact match
    if (content === `${lowerPattern}:*`) return true   // prefix syntax
    if (content === `${lowerPattern}*`) return true    // wildcard at end
    if (content === `${lowerPattern} *`) return true   // wildcard with space
    if (content.startsWith(`${lowerPattern} -`) && content.endsWith('*')) return true
  }
  return false
}
```

**Plain English:** "A Bash rule is 'dangerous' if it would let the model run arbitrary code through an interpreter — python, node, bash, eval, etc. These rules are stripped in auto mode because they'd let the model bypass the safety classifier entirely."

### The dangerous patterns list: what's on the blocklist
File: `claude-code-source/src/utils/permissions/dangerousPatterns.ts` (lines 18-55)

```ts
export const CROSS_PLATFORM_CODE_EXEC = [
  'python', 'python3', 'python2',
  'node', 'deno', 'tsx',
  'ruby', 'perl', 'php', 'lua',
  'npx', 'bunx', 'npm run', 'yarn run', 'pnpm run', 'bun run',
  'bash', 'sh',
  'ssh',
] as const

export const DANGEROUS_BASH_PATTERNS: readonly string[] = [
  ...CROSS_PLATFORM_CODE_EXEC,
  'zsh', 'fish',
  'eval', 'exec', 'env', 'xargs', 'sudo',
]
```

**Plain English:** "These are the commands that can run arbitrary code — interpreters, package runners, shells, and privilege escalators. A rule that auto-allows any of these would let the model do anything. So they require explicit approval, every time."

### Auto mode state: the circuit breaker
File: `claude-code-source/src/utils/permissions/autoModeState.ts` (lines 1-35)

```ts
let autoModeActive = false
let autoModeCircuitBroken = false

export function setAutoModeCircuitBroken(broken: boolean): void {
  autoModeCircuitBroken = broken
}

export function isAutoModeCircuitBroken(): boolean {
  return autoModeCircuitBroken
}
```

**Plain English:** "If auto mode detects that it's been misconfigured or that a safety gate has been tripped, it sets a 'circuit broken' flag. Once broken, auto mode won't re-engage — even if you try to turn it back on. This prevents a bad configuration from silently re-enabling itself."

## Interactive Elements

- [x] **Code↔English translation** — the `isDangerousBashPermission` snippet, annotated rule by rule
- [x] **Quiz** — 3 questions: (1) safety: "you add the rule `Bash(python:*)` to your settings — what happens in auto mode?" (2) configuration: "you want the agent to run `git status` and `git diff` but nothing else — what's the tightest rule?" (3) debugging: "the agent asks for confirmation before running `npm test` — what rule would auto-approve it?"
- [x] **Group chat animation** — User → QueryEngine: "run the tests." QueryEngine → PermissionGate: "can I run `npm test`?" PermissionGate → RuleChecker: "check rules for Bash(npm test)." RuleChecker → PermissionGate: "no matching rule." PermissionGate → User: "approve `npm test`?" User → PermissionGate: "yes, and remember it." PermissionGate → QueryEngine: "approved." QueryEngine → BashTool: "run `npm test`."
- [x] **Data flow animation** — tool call request → permission gate → rule lookup → match/no-match → approve/deny/ask → tool executes or stops
- [x] **Other** — badge list of the four permission modes with descriptions; step cards for "how to read a permission denial"; callout on the circuit breaker

## Aha! Callout Boxes

1. **"Tight rules are better than broad rules"** — `Bash(git status)` is better than `Bash(git:*)` which is better than `Bash(*)`. The tighter the rule, the less surface area for the agent to do something unexpected. Start tight and loosen only when you hit friction.
2. **"The classifier is your safety net, not your only defense"** — Auto mode uses a classifier to evaluate each command. But the classifier can be wrong. The permission rules are a second layer — they define what the classifier is even allowed to approve. Defense in depth: two independent checks are harder to fool than one.

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Group Chat Animation", "Message Flow / Data Flow Animation", "Permission/Config Badges", "Multiple-Choice Quizzes", "Numbered Step Cards", "Callout Boxes", "Glossary Tooltips"
- `references/design-system.md` → "Color Palette", "Typography", "Module Structure"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous module:** Tools and the Outside World — explained what tools exist; this module explains how access to those tools is controlled
- **Next module:** Speed Tricks and Debugging — shows how the app stays fast and where to look when things go wrong
- **Tone/style notes:** Make the safety logic feel like a precision instrument, not a bureaucratic obstacle. Every rule has a reason. Every confirmation screen is the system asking a real question. The learner should finish this module feeling empowered to configure their own workflows, not frustrated by restrictions.
