# Module 13: Hooks as Runtime Policy Engine

## Teaching Arc
- **Metaphor:** Hooks are a runtime control plane, not a side script runner.
- **Opening hook:** Most teams treat hooks as shell callbacks; production behavior shows they are policy evaluators with lifecycle ownership.
- **Key insight:** Hook behavior is determined by four layers: typed event input, hook matching/merging, concurrent execution semantics, and permission/policy integration.
- **Why should I care?** Misunderstanding this layer causes silent policy drift: tool approvals bypassed incorrectly, stop-time deadlocks, teammate idle races, or non-blocking failures misread as hard blocks.

## Core Source References
- `source/claude-code-source/src/query/stopHooks.ts`
- `source/claude-code-source/src/utils/hooks.ts`
- `source/claude-code-source/src/utils/hooks/hookHelpers.ts`
- `source/claude-code-source/src/utils/hooks/execAgentHook.ts`
- `source/claude-code-source/src/entrypoints/sdk/coreSchemas.ts`
- `source/claude-code-source/src/main.tsx`
- `source/claude-code-source/src/utils/permissions/permissions.ts`
- `source/claude-code-source/src/services/tools/toolHooks.ts`
- `source/claude-code-source/src/tools/TaskUpdateTool/TaskUpdateTool.ts`
- `source/claude-code-source/src/cli/structuredIO.ts`
- `source/claude-code-source/src/utils/hooks/hookEvents.ts`

## Source Coverage Added
- **Lifecycle and event model**
  - `coreSchemas.ts`: `HOOK_EVENTS`, `HookInputSchema`, and typed inputs for `Stop`, `SubagentStop`, `TeammateIdle`, `TaskCompleted`, `PermissionRequest`.
  - `hooks.ts`: `createBaseHookInput()`, `getMatchingHooks()`, matcher query derivation, deduplication, and `if`-condition filtering.
- **Blocking vs non-blocking semantics**
  - `hooks.ts`: `executeHooks()` outcome mapping (`success`, `blocking`, `non_blocking_error`, `cancelled`), exit-code handling (2 = blocking), JSON hook output parsing, and async/background hook behavior.
  - `hooks.ts`: `getStopHookMessage()`, `getTeammateIdleHookMessage()`, `getTaskCompletedHookMessage()`.
- **Policy gating path**
  - `hooks.ts`: workspace-trust gate (`shouldSkipHookDueToTrust`), managed hooks controls (`shouldAllowManagedHooksOnly`, `shouldDisableAllHooksIncludingManaged`), and permission-behavior precedence.
  - `toolHooks.ts`: hook permission resolution where hook `allow` still rechecks rule-based permissions (`checkRuleBasedPermissions`).
  - `permissions.ts` + `structuredIO.ts`: PermissionRequest hook integration, including SDK prompt-vs-hook race and headless agent fallback decision path.
- **Stop / teammate / task hook orchestration**
  - `stopHooks.ts`: stop chain sequencing, summary message assembly, continuation prevention, and teammate path (`TaskCompleted` then `TeammateIdle`).
  - `TaskUpdateTool.ts`: status transition to `completed` blocked when `TaskCompleted` hooks return blocking errors.
- **Agent hook runtime**
  - `execAgentHook.ts` + `hookHelpers.ts`: structured-output enforcement (`SyntheticOutputTool`), disallowed-tool filtering, bounded verifier turns, and hook-agent decision conversion to blocking/success.
- **Startup / event emission points**
  - `main.tsx`: startup hook/event enabling (`setAllHookEventsEnabled`, `processSessionStartHooks` parallelization with startup work).
  - `hookEvents.ts`: always-emitted events (`SessionStart`, `Setup`) and optional all-event emission path.

## Screens
1. Runtime policy engine architecture (event contract → matcher → executor → policy output)
2. Lifecycle/event schema and typed hook input model
3. Parallel execution engine with blocking vs non-blocking outcome mapping
4. Policy gating chain: trust, managed policy, hook decisions, permission rule enforcement
5. Stop-time orchestration with teammate/task hooks and completion guards
6. Agent hook verifier runtime (structured output + bounded execution)
7. Quiz (3 questions) for lifecycle, gating, and blocking semantics

## Required Interactive Elements
- 5+ screens in EN module
- 5+ screens in ZH module
- 2+ code-to-explanation translation blocks in EN
- 2+ code-to-explanation translation blocks in ZH
- 1 quiz in EN
- 1 quiz in ZH

## Notes
- Chinese copy is direct and implementation-focused, with no rhetorical contrast patterns.
- This module uses runtime and schema paths from the current repo snapshot (`src/utils/permissions/permissions.ts` instead of `src/permissions/permissions.ts`).
