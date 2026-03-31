# Module 8: Extensions: MCP, Skills, Plugins

## Teaching Arc
- **Metaphor:** A city with three different ways to add capability: utility hookups, reusable operating procedures, and packaged storefronts.
- **Opening hook:** Claude Code is not only a fixed set of built-in tools. It grows through protocols, packaged plugins, and prompt-shaped skills.
- **Key insight:** MCP, Skills, and Plugins are three different extension surfaces with different tradeoffs. If you treat them as interchangeable, you will design the wrong integration.
- **Why should I care?** This is the difference between “add a workflow,” “connect a service,” and “ship an installable extension.” Better vocabulary gives better system design.

## Core Source References
- `source/claude-code-source/src/main.tsx`
- `source/claude-code-source/src/commands.ts`

## Screens
1. Three extension layers and what each one is for
2. Startup registration of bundled plugins and skills
3. Aggregation of skill-dir, plugin, bundled, and built-in plugin skills
4. Plugin CLI as first-class product surface
5. Quiz: decide whether a feature belongs in MCP, Skill, or Plugin

## Required Interactive Elements
- 2 code-to-English translations
- 1 architecture/pattern section
- 1 quiz

## Tone
- Concrete and taxonomic
- Focus on boundaries and decision rules, not buzzwords
