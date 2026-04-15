# harmony-app-dev

[中文版本 / Chinese version](./README.zh.md)

HarmonyOS / ArkUI development skill for AI agents.

## What it does

This skill helps an AI agent implement HarmonyOS features more reliably by:
- classifying the requirement into the correct Harmony capability domain
- pointing to the right local references first
- guiding official API lookup when exact names/signatures matter
- providing practical fallback strategies for MVP implementation

Official HarmonyOS documentation remains the source of truth for exact APIs, property names, method signatures, decorators, and capability boundaries. This skill is designed to improve navigation and implementation quality, not to replace official references.

## Best for

- HarmonyOS app development
- ArkUI page and component implementation
- visual effects, animations, gestures, Canvas demos
- Widget and app-model related implementation guidance
- reducing hallucinated Harmony APIs

## Language Support

This repository maintains separate English and Chinese documentation where practical.

Current rule:
- `README.md` is the English version
- `README.zh.md` is the Chinese version
- cross-links are kept between both versions
- exact official API names should remain in their original form when verification matters

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
├── official-search-playbook.md
├── example-cookbook.md
├── official-api-examples.md
└── visual-effects-recipes.md
```

## Notes

- `SKILL.md` is the skill entrypoint used by the agent
- `references/` contains focused domain references loaded as needed
- The skill is designed to be lightweight and practical, not a full HarmonyOS API encyclopedia
