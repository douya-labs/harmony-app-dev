---
title: "UI Implementation Rules"
description: "This file defines the default implementation behavior for HarmonyOS / ArkUI UI work, especially for demo apps and visual pages."
sidebar:
  order: 2
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/ui-implementation-rules.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/ui-implementation-rules.md)

## Purpose

This file defines the default implementation behavior for HarmonyOS / ArkUI UI work, especially for demo apps and visual pages.

## Default implementation strategy

### 1. Build page shells first
Before polishing a single effect page, create:
- app structure
- home page
- route wiring
- reusable page scaffold
- reusable bottom info drawer
- shared demo registry

### 2. Prefer runnable effects over perfect abstractions
For MVP:
- a convincing, runnable effect is better than an elegant but incomplete architecture
- do not over-abstract too early
- use reusable components only where the pattern is clearly repeated

### 3. Prefer ArkUI-native composition
Default preference order:
1. ArkUI layout + style + transform + animation
2. Canvas / 2D drawing when standard components are not enough
3. ArkGraphics 3D only when simpler transforms cannot reasonably produce the effect

### 4. Allow fallback implementations
Examples:
- “shared element transition” can be approximated with card expansion + fade + scale
- “3D carousel” can be approximated with translate + scale + opacity + slight rotateY
- “glassmorphism” can be approximated with transparency + border + shadow if blur APIs are uncertain

### 5. Do not import third-party UI libraries by default
Unless the user explicitly asks, stay native.

## Recommended page pattern

### Home page
- hero/title area
- 2-column effect card grid
- lightweight animated previews in cards
- clear navigation to effect pages

### Effect detail page
- large demo area
- back button
- bottom drawer with explanation + code snippet

## Recommended delivery order

1. home page + routing
2. reusable scaffold and card components
3. easiest high-impact pages first
4. harder API-sensitive pages later

## High-impact pages that are usually safe to start with
- glass / blur gallery
- glow / shadow gallery
- gradient motion
- wave progress
- 2.5D flip card

## Pages that may require more API verification
- shared-element-like transitions
- advanced gestures
- true 3D scene pages

## Anti-patterns

- treating ArkUI like HTML/CSS with assumed property names
- designing a huge capability platform before a small MVP works
- creating 10 completely different page architectures with no shared scaffold
- waiting for perfect API confidence before delivering a reasonable fallback

## Official documentation entry points

- ArkUI overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkui-overview-V5
- Declarative component index: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/arkui-declarative-comp-V5
- Universal attributes: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-size-V5
- ArkUI animation overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-animation-overview-V5
- ArkUI gesture overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-gesture-events-V5

## Capability mapping

This file maps to coverage matrix row: "UI 开发 (ArkUI 声明式 UI)".

