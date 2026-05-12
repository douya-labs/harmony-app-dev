---
title: "Official API Examples"
description: "Use this file for high-frequency or API-sensitive HarmonyOS features where an execution environment may lack search capability."
sidebar:
  order: 6
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/official-api-examples.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/official-api-examples.md)

## Purpose

Use this file for high-frequency or API-sensitive HarmonyOS features where an execution environment may lack search capability.

This file stores:
- direct official documentation URLs
- known API facts already confirmed from prior lookup
- cautious implementation notes

Important: if the exact runtime behavior still matters, official docs remain the final source of truth.

---

## 1. Component snapshot related docs

### Official URLs
- `https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V6/js-apis-arkui-componentsnapshot-0000001862687677-V6`
- `https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V6/ts-universal-attributes-component-snapshot-0000002074876825-V6`

### What to use this for
- capturing component snapshots
- exporting a rendered component as an image-like artifact
- screenshotting specific ArkUI components or page areas

### Engineering guidance
- Use these URLs when implementing component-to-image export or component capture features
- If the runtime environment cannot fetch docs well, keep the feature behind a small adapter so the exact API call can be swapped once verified
- Do not hardcode guessed method signatures if they have not been verified in the current SDK

### Safe implementation pattern
- design a `SnapshotService` abstraction
- pass the target component identity or reference into the service
- keep export / save logic separate from UI composition

---

## 2. MultimodalAwarenessKit motion / holding hand detection

### Official URL
- `https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V6/js-apis-multimodalawarenesskit-motion-0000001923682049-V6`

### Related API diff URL
- `https://developer.huawei.com/consumer/cn/doc/harmonyos-releases/js-apidiff-multimodalawarenesskit-6002`

### Known confirmed fact
Prior verified lookup indicates:
- `holdingHandChanged` is part of `motion`
- it was introduced in **HarmonyOS 6.0.2(22) Beta2**
- subscription shape is conceptually:
  - `on('holdingHandChanged', callback)`
  - `off('holdingHandChanged', callback?)`

### Use this for
- holding-hand status awareness
- gesture/pose-aware interaction experiments
- awareness-driven UI state changes

### Caution
- verify exact type names and callback payload shapes in official docs before final production code
- do not assume this API is available in older SDKs

---

## 3. How to use this file in no-search environments

When search is unavailable:
1. use the direct official URLs here first
2. use `example-cookbook.md` for implementation scaffolding
3. keep API-sensitive logic isolated behind small service wrappers
4. annotate code with `verify against official docs` when exact signatures remain uncertain

This approach is safer than guessing API names across the whole page implementation.
