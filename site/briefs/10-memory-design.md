# Module 10: Memory Design

## Teaching Arc
- **Metaphor:** A constrained memory database with an always-loaded index and typed records, backed by guarded filesystem boundaries.
- **Opening hook:** Memory quality depends more on structure and safety than on total volume.
- **Key insight:** Claude Code memory is designed as a bounded, typed, and security-aware subsystem: index caps, strict path validation, selective recall, and checksum-based team sync.
- **Why should I care?** This determines whether memory stays useful over weeks of collaboration, or degrades into stale and noisy context.

## Core Source References
- `source/claude-code-source/src/memdir/memdir.ts`
- `source/claude-code-source/src/memdir/paths.ts`
- `source/claude-code-source/src/memdir/memoryTypes.ts`
- `source/claude-code-source/src/memdir/findRelevantMemories.ts`
- `source/claude-code-source/src/memdir/teamMemPaths.ts`
- `source/claude-code-source/src/memdir/teamMemPrompts.ts`
- `source/claude-code-source/src/services/teamMemorySync/index.ts`
- `source/claude-code-source/src/services/teamMemorySync/watcher.ts`

## Screens
1. Memory subsystem map: entrypoint index, typed files, retrieval lane, team sync lane
2. Entrypoint truncation design: dual caps (`MAX_ENTRYPOINT_LINES`, `MAX_ENTRYPOINT_BYTES`) and warning behavior
3. Path resolution and enablement policy: env/settings precedence, normalized trusted auto-memory path
4. Team path security model: key sanitization + resolve check + realpath containment check
5. Selective recall and sync mechanics: up-to-5 relevant memories, debounce watcher, checksum-delta push, conflict flow
6. Quiz: test understanding of truncation rationale, symlink defense, and push strategy

## Required Interactive Elements
- 3 code-to-plain-language translations
- 1 architecture/pattern section
- 1 flow section with ordered steps
- 1 quiz

## Tone
- Technical and operational
- Focus on invariants, guardrails, and failure modes
- Prioritize concrete design rules over abstract memory theory
