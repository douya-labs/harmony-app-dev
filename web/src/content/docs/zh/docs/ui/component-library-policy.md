---
title: "Component Library Policy"
description: "The official ArkUI declarative component index should define the top-level grouping of our local Harmony component library."
sidebar:
  order: 8
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/component-library-policy.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/component-library-policy.md)

## Source-of-truth policy

The official ArkUI declarative component index should define the top-level grouping of our local Harmony component library.

Reference page:
- https://developer.huawei.com/consumer/cn/doc/harmonyos-references/arkui-declarative-comp

## Rule

For every component group that appears in the official ArkUI declarative component index:
- our local Harmony component library should contain a matching group entry
- the local grouping names should follow the official grouping as closely as practical
- missing groups should be added even if only as placeholders first
- each group can start lightweight, but must point to at least:
  - what the group is for
  - representative components
  - implementation notes / pitfalls when available
  - official lookup path or keyword

## Practical rollout

1. Extract the official group list from the source page.
2. Create a local group map in the component library.
3. Fill each group with at least minimal reference coverage.
4. Expand high-priority groups first when product work touches them.

## Capability mapping

This file maps to coverage matrix row: "UI 开发 (ArkUI 声明式 UI) - 组件目录策略".

## Current blocker

The Huawei docs site currently returns the SPA shell to command-line fetches in this environment, so the exact group list still needs to be extracted via a working browser/session or another reliable fetch path.

Until then, this policy still stands: official ArkUI declarative component groups are the target taxonomy for our local component library.
