# Module 16: Auto Mode Architecture

## Teaching Arc
- **Metaphor:** Auto mode is a guarded autonomy pipeline with explicit entry, explicit stripping, and explicit failure exits.
- **Opening hook:** The surface looks like “skip fewer prompts,” but the runtime is more exacting: mode entry is gated, broad allow-rules are removed, safe actions take cheap fast paths, and classifier failures fall back in different ways depending on context.
- **Key insight:** Auto mode works only because four mechanisms cooperate: mode resolution, dangerous-permission stripping, classifier-mediated permission checks, and stateful exit/recovery behavior.
- **Why should I care?** This is where autonomy becomes trustworthy or dangerous. If you misread this layer, you will misunderstand why some actions still prompt, why broad shell rules disappear, or why headless agents can abort on classifier failures.

## Core Source References
- `source/claude-code-source/src/types/permissions.ts`
- `source/claude-code-source/src/utils/permissions/permissionSetup.ts`
- `source/claude-code-source/src/utils/permissions/permissions.ts`
- `source/claude-code-source/src/utils/permissions/bypassPermissionsKillswitch.ts`
- `source/claude-code-source/src/bootstrap/state.ts`
- `source/claude-code-source/src/cli/handlers/autoMode.ts`
- `source/claude-code-source/src/main.tsx`

## Source Coverage Added
- **Mode surface and entry gate**
  - `types/permissions.ts`: public/internal permission mode sets and classifier-related decision fields.
  - `permissionSetup.ts`: `initialPermissionModeFromCLI`, `verifyAutoModeGateAccess`, opt-in logic, model/fast-mode gating, and notification decisions.
- **Dangerous rule stripping**
  - `permissionSetup.ts`: `findDangerousClassifierPermissions`, `stripDangerousPermissionsForAutoMode`, `restoreDangerousPermissions`, and transition semantics when entering/leaving auto.
- **Permission decision pipeline**
  - `permissions.ts`: safety-check handling, PowerShell guard, acceptEdits fast path, allowlisted tool fast path, `classifyYoloAction(...)`, transcript-too-long behavior, unavailable-classifier fallback, denial tracking, and final classifier allow/deny decisions.
- **State and UX attachments**
  - `bootstrap/state.ts`: session-only auto-mode exit attachment flags and sticky header behavior.
  - `permissionSetup.ts`: plan-mode interaction (`prepareContextForPlanMode`) and kick-out path when auto becomes unavailable.
  - `bypassPermissionsKillswitch.ts`: async verification and state-safe update flow in interactive mode.
- **Operator-facing inspection tools**
  - `autoMode.ts` + `main.tsx`: `claude auto-mode defaults`, `config`, and `critique`.

## Screens
1. Guarded autonomy architecture (entry gate, stripping, decision pipeline, exit behavior)
2. Mode entry and availability resolution
3. Dangerous permission stripping before classifier execution
4. Cheap fast paths before classifier evaluation
5. Failure handling: transcript-too-long, unavailable classifier, denial accumulation
6. State recovery, plan-mode interaction, and operator inspection tools
7. Quiz: mode entry, stripping rationale, and failure behavior

## Required Interactive Elements
- EN: 6 content screens + 1 quiz screen
- ZH: 6 content screens + 1 quiz screen
- 4 code-to-explanation translation blocks per language
- 1 quiz per language (3 questions each)

## Notes
- Chinese copy uses direct technical sentences and avoids contrast-rhetoric patterns.
- Framing is informed by the public Anthropic engineering writeup on auto mode, but the module content stays grounded in the local source tree and its observable runtime behavior.
