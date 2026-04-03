# Module 9: Cost and Token Economics

## Teaching Arc
- **Metaphor:** One runtime, three ledgers: billing, token pressure, and operational throughput.
- **Opening hook:** A single “how much did this cost?” answer is incomplete unless you can explain where token counters, budget controls, and session persistence are computed.
- **Key insight:** Claude Code implements cost economics as layered accounting: per-response aggregation, per-session persistence, and long-horizon usage analytics.
- **Why should I care?** If you use the wrong token metric or budget control path, your compaction thresholds, continuation policy, and reported economics drift from actual runtime behavior.

## Core Source References
- `source/claude-code-source/src/cost-tracker.ts`
- `source/claude-code-source/src/costHook.ts`
- `source/claude-code-source/src/query.ts`
- `source/claude-code-source/src/query/tokenBudget.ts`
- `source/claude-code-source/src/utils/tokenBudget.ts`
- `source/claude-code-source/src/utils/tokens.ts`
- `source/claude-code-source/src/commands/cost/cost.ts`
- `source/claude-code-source/src/commands/insights.ts`

## Screens
1. Cost/token economics map: billing ledger, token ledger, operational ledger
2. Session cost accumulation pipeline from `addToTotalSessionCost`
3. Session-bound persistence/restore and exit-hook saving behavior
4. Token budget parsing (`+500k`, `use/spend`) and continuation stop logic
5. Token metric semantics in `utils/tokens.ts` (`usage`, final context, estimation)
6. Command-level observability split: `/cost` (current session) vs `/insights` (historical aggregation)
7. Quiz: choose correct accounting and budget behaviors

## Required Interactive Elements
- 4 code-to-explanation translation blocks per language
- 1 architecture/pattern framing section
- 1 quiz per language (3 questions each)

## Tone
- Technical and operational
- Focus on accounting boundaries and runtime semantics
- Avoid generic “prompt tips”; stay grounded in concrete source behavior
