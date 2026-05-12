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
├── coverage.md
├── capability-map.md
├── api-watch.md
├── official-search-playbook.md
├── official-api-examples.md
├── app-model.md
├── ui-implementation-rules.md
├── visual-effects-recipes.md
├── example-cookbook.md
├── component-library-policy.md
├── graphics-3d.md
├── widget.md
├── widget-cookbook.md
├── state-management.md
├── animation-and-gesture.md
├── canvas.md
├── permissions.md
├── network.md
├── persistence.md
├── file-management.md
├── media-and-camera.md
├── notification.md
├── location.md
├── concurrency.md
├── background-tasks.md
├── security-and-privacy.md
├── debugging.md
├── publishing.md
├── packaging.md
├── distributed.md
├── atomic-service.md
├── arkts-language.md
├── resource-management.md
├── i18n.md
├── accessibility.md
├── cross-device.md
└── ui-design.md
```

## Notes

- `SKILL.md` is the skill entrypoint used by the agent
- `references/` contains focused domain references loaded as needed
- The skill is designed to be lightweight and practical, not a full HarmonyOS API encyclopedia

## Companion website — ohosdev.com

A public, SEO-friendly developer hub built from the same `references/` content lives in [`douya-labs/ohosdev`](https://github.com/douya-labs/ohosdev). It powers **https://ohosdev.com**.

The site has two content layers:

- **`/docs/`** — the 38 reference files in `references/`, auto-synced and rendered as a docs portal (English + Chinese-with-pending-translations).
- **`/tutorials/`**, **`/stories/`**, **`/tips/`**, **`/showcase/`** — long-form content written *on top of* the references, for SEO and readability.

If you edit `references/`, the site picks it up on next build (the ohosdev repo's `npm run sync:refs` pulls from this repo).
