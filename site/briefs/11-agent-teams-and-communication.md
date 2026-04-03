# Module 11: Agent Teams and Communication

## Teaching Arc
- **Metaphor:** A distributed operations room where coordinator policy, transport protocol, and UI queues must agree on message semantics.
- **Opening hook:** Multi-agent quality is not only model quality. It is mostly communication quality: who sends what, where, and how it is consumed.
- **Key insight:** Claude Code treats team communication as a first-class runtime: coordinator contracts, mailbox transport, permission relay queues, and headless notification re-injection.
- **Why should I care?** If you can diagnose the communication stack, you can fix multi-agent stalls, permission deadlocks, and "worker finished but nothing happened" failures quickly.

## Core Source References
- `source/claude-code-source/src/coordinator/coordinatorMode.ts`
- `source/claude-code-source/src/utils/teammateMailbox.ts`
- `source/claude-code-source/src/utils/swarm/permissionSync.ts`
- `source/claude-code-source/src/utils/swarm/reconnection.ts`
- `source/claude-code-source/src/utils/swarm/teammateInit.ts`
- `source/claude-code-source/src/utils/swarm/inProcessRunner.ts`
- `source/claude-code-source/src/screens/REPL.tsx`
- `source/claude-code-source/src/state/AppStateStore.ts`
- `source/claude-code-source/src/cli/print.ts`
- `source/claude-code-source/src/setup.ts`
- `source/claude-code-source/src/main.tsx`

## Screens
1. System map: coordinator policy, mailbox transport, queue state, headless parity
2. Coordinator contract: worker tool context, `<task-notification>` semantics, concurrency workflow
3. Mailbox internals: inbox pathing, lock-based writes, structured protocol message filtering
4. Permission relay: worker-to-leader sandbox request and leader response path in REPL
5. Communication visualization: mailbox group-chat pattern from request to completion signal
6. Session coherence: startup snapshots, team context hydration, AppState queues, print-mode polling
7. Quiz: protocol interpretation, race prevention, permission routing decisions

## Required Interactive Elements
- 2+ code-to-English/Chinese translation blocks per language
- 1 communication-oriented visualization (`chat-window`)
- 1 quiz per language

## Tone
- Protocol-first and operational
- Focus on message schemas, routing boundaries, and failure diagnosis
