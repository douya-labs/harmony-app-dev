---
name: harmony-app-dev
description: Implement HarmonyOS / ArkUI app features with correct capability classification, official API lookup, and practical fallback strategies. Use when building HarmonyOS apps, ArkUI pages, visual effects, animations, gestures, Canvas demos, Widgets, routing, or app structure. / 用于 HarmonyOS / ArkUI 应用开发：当任务涉及鸿蒙页面、视觉效果、动画、手势、Canvas、Widget、路由或应用结构时，帮助 AI 先判断能力域、再查官方 API、再给出可落地实现与降级方案，避免臆造 API。
---

# harmony-app-dev

Use this skill for **HarmonyOS / ArkUI development tasks** where the main risk is choosing the wrong capability, searching the wrong docs, or inventing unsupported APIs.

## Workflow

1. **Classify the task first**
   - UI / layout / component
   - visual effect / page rendering
   - animation / transition
   - gesture interaction
   - Canvas / 2D drawing
   - ArkGraphics 3D
   - Widget
   - app model / lifecycle / routing
   - media / storage / concurrency if directly required

2. **Read the smallest relevant references**
   - Always start with `references/capability-map.md`
   - Then read only the domain-specific file you need
   - Keep context lean

3. **Verify exact APIs from official docs when needed**
   - Use `references/official-search-playbook.md`
   - Do not guess HarmonyOS API names, property names, decorators, or capability boundaries

4. **Prefer a runnable MVP over a perfect but fragile design**
   - Start with ArkUI-native implementation
   - If a high-end effect is unclear or expensive, provide a lower-risk fallback
   - Do not introduce third-party UI libraries unless explicitly requested

5. **Explain the implementation basis**
   - Mention which local references informed the solution
   - Mention which official doc path should be checked when exact API details matter
   - State fallback vs ideal implementation when relevant

## Reference selection

### Always read first
- `references/capability-map.md` — classify the requirement and identify the official doc category

### Read as needed
- `references/ui-implementation-rules.md` — ArkUI UI pages, visual effects, animations, gestures, MVP-first implementation behavior
- `references/api-watch.md` — official doc entry points, version sensitivity, and “must verify exact API names” cases
- `references/graphics-3d.md` — when deciding between ArkGraphics 3D and simpler 2.5D ArkUI transforms
- `references/widget.md` — Widget / FormExtensionAbility work
- `references/app-model.md` — app structure, lifecycle, routing, page organization
- `references/official-search-playbook.md` — exact API lookup workflow and search keywords

## Output expectations

Prefer outputs that include:
- requirement classification
- recommended implementation path
- fallback strategy if exact APIs are unclear or too costly for MVP
- local references used
- official lookup path if exact verification is needed
- example code or pseudocode when helpful

## Guardrails

- Do **not** assume Web/CSS/React behavior maps directly to ArkUI
- Do **not** invent HarmonyOS component props, style props, animation APIs, or lifecycle methods
- Do **not** over-expand a focused MVP into a giant “all capability playground” unless the user asks
- Do **not** block progress waiting for perfect API certainty if a reasonable ArkUI-native fallback can deliver the UX

## Note for visual demo apps

For Harmony visual showcase apps:
- prioritize homepage + page shell + runnable effect pages first
- prefer visually convincing ArkUI-native effects over over-engineered abstractions
- use ArkGraphics 3D only when simpler transforms cannot reasonably achieve the intended effect
