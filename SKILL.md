---
name: harmony-app-dev
description: Implement HarmonyOS / ArkUI app features with correct capability classification, official API lookup, and practical fallback strategies. Use when building HarmonyOS apps, ArkUI pages, visual effects, animations, gestures, Canvas demos, Widgets, routing, or app structure. / 用于 HarmonyOS / ArkUI 应用开发：当任务涉及鸿蒙页面、视觉效果、动画、手势、Canvas、Widget、路由或应用结构时，帮助 AI 先判断能力域、再查官方 API、再给出可落地实现与降级方案，避免臆造 API。
---

# harmony-app-dev

Use this skill for **HarmonyOS / ArkUI development tasks** where the main risk is choosing the wrong capability, searching the wrong docs, or inventing unsupported APIs.

## Source of truth

For exact HarmonyOS APIs, official documentation is the source of truth.
This skill provides:
- capability classification
- official doc entry points
- search workflow
- implementation heuristics
- fallback strategies for MVP work

This skill does **not** replace official API references.
If exact property names, method signatures, decorators, or component capabilities matter, verify them from official docs before finalizing the implementation.

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
   - If the environment has weak or no search, read `references/example-cookbook.md` early for implementation scaffolds
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
- `references/coverage.md` — official-vs-local coverage matrix; the source of truth for what this skill covers
- `references/capability-map.md` — classify the requirement and identify the official doc category

### Read when bootstrapping a new HarmonyOS project
- `references/project-skeleton.md` — the minimum 17–18-file Stage Model project layout DevEco will accept on first import; how to handle `app_icon` placeholder; `.gitignore` essentials
- `references/development-workflow.md` — Linux/WSL writing + Windows/macOS DevEco validating; git as the boundary; agent↔human handoff loop

### Read as needed
- `references/app-model.md` — Stage model, UIAbility lifecycle, Navigation vs Router, Want, Context, module split
- `references/ui-implementation-rules.md` — ArkUI UI pages, visual effects, animations, gestures, MVP-first implementation behavior
- `references/visual-effects-recipes.md` — direct implementation recipes for common visual effects such as glassmorphism, glow, spring motion, shared-transition-like effects, wave progress, gesture wall, and 2.5D 3D illusions
- `references/animation-and-gesture.md` — explicit/implicit animation, spring motion, page transitions, shared element, gesture conflicts, drag-driven state
- `references/canvas.md` — procedural 2D drawing, paths, gradients, animated wave, image clipping, RAF discipline
- `references/state-management.md` — ArkUI state decorators (`@State`/`@Prop`/`@Link`/`@Provide`/`@Observed`/`AppStorage`/`PersistentStorage`); decision tree for scope and direction
- `references/permissions.md` — declaring, requesting, and handling HarmonyOS permissions; UX flow for sensitive permissions; AppGallery review awareness
- `references/network.md` — HTTP / upload / download / network state; typed HttpClient pattern; retry and offline strategy
- `references/persistence.md` — Preferences vs RDB vs Distributed KV; typed repository and schema migration
- `references/file-management.md` — sandbox layout, atomic write, document picker, cache hygiene
- `references/media-and-camera.md` — picker / system camera / Camera Kit; image decode / EXIF; audio playback
- `references/notification.md` — immediate notifications, slot types, scheduled reminders, tap intents (wantAgent)
- `references/location.md` — single / continuous location, geocoding, accuracy handling, permission UX
- `references/concurrency.md` — TaskPool vs Worker; thread boundaries; concurrency limiting; cancellation
- `references/background-tasks.md` — transient vs continuous vs scheduled background work; service extension
- `references/security-and-privacy.md` — HUKS-managed encryption, secret storage, HTTPS enforcement, masking, privacy alignment
- `references/widget-cookbook.md` — implementing service cards: provider/renderer split, data update strategies, multi-size, postCardAction
- `references/debugging.md` — HiLog discipline, Profiler workflow, ArkUI Inspector, breadcrumbs, async error boundaries
- `references/testing.md` — unit vs instrumentation; project test layout; injecting fakes; UI smoke patterns
- `references/publishing.md` — release signing, versioning, AppGallery review, privacy alignment, listing assets
- `references/packaging.md` — HAP / HAR / HSP packaging strategy, multi-module split, dependency management
- `references/distributed.md` — cross-device handoff, distributed data object, device discovery, multi-device collaboration
- `references/atomic-service.md` — atomic service constraints (10MB, install-free), service card entry, distribution paths
- `references/arkts-language.md` — ArkTS language differences from TypeScript, decorators, type system, common pitfalls
- `references/resource-management.md` — qualifier-based resources, design tokens via element json, dark mode, multi-DPI
- `references/i18n.md` — multi-language strings, intl date/number/currency formatting, RTL adaptation
- `references/accessibility.md` — accessibility text, screen reader, large font, contrast, click region, semantic grouping
- `references/cross-device.md` — responsive layout (GridRow/mediaquery), foldable adaptation, multi-device feature HAP, deviceType qualifiers
- `references/ui-design.md` — HarmonyOS Design tokens, spacing/typography/radius scales, button states, elevation, safe spacing
- `references/api-watch.md` — official doc entry points, version sensitivity, and “must verify exact API names” cases
- `references/graphics-3d.md` — when deciding between ArkGraphics 3D and simpler 2.5D ArkUI transforms
- `references/widget.md` — Widget / FormExtensionAbility work
- `references/app-model.md` — app structure, lifecycle, routing, page organization
- `references/project-skeleton.md` — minimum on-disk layout that DevEco will accept; complement to `app-model.md`
- `references/development-workflow.md` — cross-environment workflow when DevEco is not local (Linux/WSL agent + Windows/macOS reviewer)
- `references/official-search-playbook.md` — exact API lookup workflow and search keywords
- `references/example-cookbook.md` — practical ArkUI implementation scaffolds for common tasks when search is weak or unavailable
- `references/official-api-examples.md` — direct official URLs and confirmed notes for high-frequency or API-sensitive cases

## Output expectations

Prefer outputs that include:
- requirement classification
- recommended implementation path
- fallback strategy if exact APIs are unclear or too costly for MVP
- local references used
- official lookup path if exact verification is needed
- example code or pseudocode when helpful
- a clear note when the final answer still requires official API confirmation
- direct official URLs when the task depends on API-sensitive behavior

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
- if the task is to directly build a visual effect, read `references/visual-effects-recipes.md` early instead of staying only at the capability-classification layer

## Public web mirror

A public, SEO-friendly version of these references is published at **https://ohosdev.com**.
The site is auto-generated from `references/` and lives in a separate repo: [`douya-labs/ohosdev`](https://github.com/douya-labs/ohosdev).
For end-user reading, you can link readers to e.g. `https://ohosdev.com/docs/ui/canvas/`
instead of the raw GitHub markdown.
