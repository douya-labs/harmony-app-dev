---
title: "ArkGraphics 3D"
description: "Use this file when deciding whether a feature needs ArkGraphics 3D or can stay in normal ArkUI transforms."
sidebar:
  order: 7
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/graphics-3d.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/graphics-3d.md)

Consolidated from prior ArkGraphics 3D research notes and official HarmonyOS graphics documentation directions.

## Purpose

Use this file when deciding whether a feature needs ArkGraphics 3D or can stay in normal ArkUI transforms.

## Core idea

ArkGraphics 3D is the right layer for:
- real scene composition
- camera/light driven presentation
- true 3D objects / models / scene nodes
- stronger spatial light / scene depth

It is usually **not** the first choice for an MVP visual demo app if the effect can be convincingly produced with:
- translate
- scale
- rotateX / rotateY
- opacity
- zIndex
- layered shadows and gradients

## Official module direction

- `@ohos.graphics.scene`
- Scene / Camera / Light / SceneNode / Component3D

## When to stay with ArkUI transforms

Prefer ArkUI for:
- flip cards
- pseudo-3D carousel
- parallax page depth
- perspective illusions on cards

## When to escalate to ArkGraphics 3D

Consider ArkGraphics 3D only when:
- the scene truly needs camera / light / model semantics
- 2.5D transforms no longer produce the intended visual quality
- the user explicitly asks for real 3D scene rendering

## Implementation rule

For MVP demo apps:
- start with 2.5D ArkUI implementation
- mention ArkGraphics 3D as an upgrade path
- verify exact API names from official docs before coding Scene / Camera / Light logic

## Official documentation entry points

- ArkGraphics 3D overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkgraphics3d-overview-V5
- Scene API reference: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-graphics-scene-V5
- Component3D usage: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-basic-components-component3d-V5
- ArkUI transform attributes (preferred for 2.5D): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-transformation-V5

## Capability mapping

This file maps to coverage matrix row: "ArkGraphics 3D".

