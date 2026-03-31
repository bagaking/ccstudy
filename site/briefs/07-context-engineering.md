# Module 7: Context Engineering

## Teaching Arc
- **Metaphor:** A briefing room before a mission. The model is not dropped into the field with just one sentence of instruction. It receives a stack of mission notes, local maps, standing orders, team memory, and recent radio chatter.
- **Opening hook:** Most people think better prompting means writing a smarter sentence. Claude Code shows the opposite: the real leverage is assembling the right context around the model before it speaks.
- **Key insight:** Context engineering is the system that decides what the model sees: system prompt, tools, CLAUDE.md layers, memory files, and compaction strategy. Prompt wording matters, but context selection matters more.
- **Why should I care?** If an agent “forgets” repo conventions or ignores project rules, the issue is often upstream of the model call. Knowing the context stack lets you debug the right layer.

## Core Source References
- `source/claude-code-source/src/QueryEngine.ts`
- `source/claude-code-source/src/utils/claudemd.ts`
- `source/claude-code-source/src/services/compact/autoCompact.ts`

## Screens
1. Why context engineering beats prompt tweaking
2. `fetchSystemPromptParts(...)` and the system prompt assembly boundary
3. CLAUDE.md load order and priority model
4. Memory file discovery and memoized loading
5. Quiz: diagnose missing rules, stale context, and compaction effects

## Required Interactive Elements
- 2 code-to-English translations
- 1 pattern-card or step-card section
- 1 quiz

## Tone
- Dense, practical, anti-magic
- Make the learner feel the system prompt is a compiled artifact, not a string literal
