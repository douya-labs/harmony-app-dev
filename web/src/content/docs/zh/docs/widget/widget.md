---
title: "Widgets (Service Cards) Overview"
description: "Use this file when a Harmony task involves desktop widgets / service cards."
sidebar:
  order: 1
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/widget.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/widget.md)

Consolidated from prior HarmonyOS Widget research notes and official documentation directions.

## Purpose

Use this file when a Harmony task involves desktop widgets / service cards.

## What this file is for

- reminding the agent that Widget work is a separate capability domain
- signaling that Widget is not just another normal page
- pointing the agent toward FormExtensionAbility and widget-specific lifecycle/update behavior

## Use this reference when the user asks for
- desktop widget
- service card
- home screen card
- widget refresh logic
- widget data binding

## Engineering rule

Do not assume normal page/component lifecycle rules apply directly to Widget work. Check official Widget documentation first.

## MVP note

For visual demo apps, Widget pages are usually not first priority unless the app explicitly centers on service card demos.

## Official documentation entry points

- Service widget overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/service-widget-overview-V5
- ArkTS widget development: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-working-principles-V5
- FormExtensionAbility lifecycle: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-lifecycle-V5
- Widget data update: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-update-by-proxy-V5
- Widget interaction (router/call/message): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-event-overview-V5

## Capability characteristics

A HarmonyOS widget is fundamentally different from a normal page:

- runs inside a sandboxed `FormExtensionAbility`
- UI is defined as a separate ArkTS widget page (a subset of ArkUI)
- update model is push/refresh based, not direct re-render
- widget cannot run arbitrary code on each frame
- communication with main app uses widget event system (router event, call event, message event)

## Decision: when to build a widget

Use a widget when:

- the app needs glanceable surface area on the home screen
- a frequent action should be 1 tap from the launcher
- a key piece of state benefits from being shown without opening the app

Do not build a widget when:

- the experience needs full ArkUI page capability
- the data needs constant high-frequency updates
- the interaction model requires deep navigation flows

## Capability mapping

This file maps to coverage matrix row: "Widget / 服务卡片 (FormExtensionAbility)".

