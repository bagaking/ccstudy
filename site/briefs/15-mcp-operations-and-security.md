# Module 15: MCP Operations and Security

## Teaching Arc
- **Metaphor:** MCP in production is a control plane, not a single connector.
- **Opening hook:** Most MCP incidents are operational: wrong scope merge, stale tokens, oversized output, trust-boundary violations, or misclassified failures.
- **Key insight:** Reliable MCP usage requires explicit handling of five layers: scope precedence, auth/token lifecycle, output caps, prompt-injection trust boundaries, and signature-based debugging.
- **Why should I care?** These are the paths that create hard-to-diagnose outages and silent correctness bugs in real agent runs.

## Core Source References
- `source/claude-code-source/src/services/mcp/types.ts`
- `source/claude-code-source/src/services/mcp/config.ts`
- `source/claude-code-source/src/services/mcp/auth.ts`
- `source/claude-code-source/src/services/mcp/client.ts`
- `source/claude-code-source/src/services/mcp/claudeai.ts`
- `source/claude-code-source/src/main.tsx`
- `source/claude-code-source/src/constants/prompts.ts`
- `source/claude-code-source/src/utils/mcpValidation.ts`
- `source/claude-code-source/src/utils/mcpOutputStorage.ts`
- `source/claude-code-source/src/cli/handlers/mcp.tsx`

## Source Coverage Added
- **Config scopes and policy gates**
  - `types.ts`: full `ConfigScope` surface (`local/user/project/dynamic/enterprise/claudeai/managed`).
  - `config.ts`: per-scope loading, enterprise exclusive mode, policy filtering, merge precedence (`plugin < user < project < local`), dynamic config filtering.
  - `main.tsx`: `--mcp-config` validation path and enterprise dynamic-config rejection.
- **Auth and token lifecycle**
  - `auth.ts`: OAuth request timeout, sensitive URL param redaction, proactive refresh, step-up scope handling, lockfile refresh coordination, retry and invalid_grant clearing.
  - `client.ts`: needs-auth cache TTL, auth-failure classification, `McpAuthError` propagation.
  - `claudeai.ts`: explicit `user:mcp_servers` scope requirement.
- **Output caps and large result handling**
  - `mcpValidation.ts`: max token cap resolution order, truncation threshold, truncation flow.
  - `client.ts`: env-gated file persistence path, image-content fallback behavior.
  - `mcpOutputStorage.ts`: large-output read instructions contract.
- **Prompt-injection and trust boundaries**
  - `prompts.ts`: explicit prompt-injection handling rule for external tool data and MCP server instructions injection point.
  - `main.tsx`: trust warnings on `mcp list/get` command descriptions.
- **Operational debugging**
  - `client.ts`: connection timeout, tool timeout, session-expired detection (`404/-32001` and closed-connection fallback), cache reset on expiry.
  - `mcp.tsx`: concurrent health-check status output (`Connected`, `Needs authentication`, `Failed`).

## Screens
1. Five operational control layers for MCP runtime behavior
2. Config scopes, precedence, enterprise gates, and dynamic policy filtering
3. OAuth/token lifecycle: redaction, refresh, step-up, and cache semantics
4. Output cap enforcement, truncation, and large-result persistence flow
5. Prompt-injection handling and trust-boundary command semantics
6. Failure-signature debugging workflow for operations
7. Quiz: scope policy, auth step-up behavior, and injection response

## Required Interactive Elements
- EN: 6 content screens + 1 quiz screen, 5 translation blocks
- ZH: 6 content screens + 1 quiz screen, 5 translation blocks
- 1 quiz per language (3 questions each)

## Notes
- Chinese copy is direct technical style and avoids banned contrast rhetoric patterns.
- Module content focuses on operations and security depth, not introductory MCP concepts from Module 8.
