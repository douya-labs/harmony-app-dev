---
title: "API Watch"
description: "Use this file to remember the official documentation entry points and a few critical rules: - HarmonyOS docs must be checked from official sources when exact API names matter - local notes are for …"
sidebar:
  order: 4
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/api-watch.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/api-watch.md)

Consolidated from prior HarmonyOS research notes and official documentation entry points.

## Purpose

Use this file to remember the official documentation entry points and a few critical rules:
- HarmonyOS docs must be checked from official sources when exact API names matter
- local notes are for direction and workflow, not guaranteed method signatures
- version drift is real, especially around visual and graphics APIs

## Official entry points

- HarmonyOS docs home: `https://developer.huawei.com/consumer/cn/doc/`
- Guides: `https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5`
- References: `https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V6`
- Release Notes: `https://developer.huawei.com/consumer/cn/doc/harmonyos-releases-V6`

## What this means in practice

### Use local notes for
- capability classification
- deciding which implementation direction is sensible
- knowing whether a feature is likely ArkUI, Canvas, Widget, or ArkGraphics 3D
- deciding if an MVP fallback is acceptable

### Use official docs for
- exact API names
- exact decorators / component properties / method signatures
- current SDK capability confirmation
- version-specific behavior

## Areas that often need official verification

- blur / background blur / visual style property names
- gesture API naming and combinations
- animation curve and transition APIs
- Canvas context details
- routing / navigation details
- Component3D and ArkGraphics scene APIs

## Engineering rule

If the implementation would fail because a property or method name is wrong, verify against official docs first. Do not guess.

## MVP-friendly rule

If the official ideal API is unclear but the intended UX can be delivered with simpler ArkUI-native composition, ship the fallback for MVP and note the upgrade path.
