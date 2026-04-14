# harmony-app-dev

HarmonyOS / ArkUI development skill for AI agents.

## What it does

This skill helps an AI agent implement HarmonyOS features more reliably by:
- classifying the requirement into the correct Harmony capability domain
- pointing to the right local references first
- guiding official API lookup when exact names/signatures matter
- providing practical fallback strategies for MVP implementation

## Best for

- HarmonyOS app development
- ArkUI page and component implementation
- visual effects, animations, gestures, Canvas demos
- Widget and app-model related implementation guidance
- reducing hallucinated Harmony APIs

## Structure

```text
SKILL.md
references/
├── capability-map.md
├── api-watch.md
├── ui-implementation-rules.md
├── graphics-3d.md
├── widget.md
├── app-model.md
└── official-search-playbook.md
```

## Notes

- `SKILL.md` is the entrypoint used by the agent
- `references/` contains focused domain references loaded as needed
- The skill is designed to be lightweight and practical, not a full HarmonyOS API encyclopedia
