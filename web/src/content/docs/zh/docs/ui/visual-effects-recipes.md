---
title: "Visual Effects Recipes"
description: "Use this file when the task is not just to understand HarmonyOS capabilities, but to **directly implement a visual effect** in ArkUI."
sidebar:
  order: 4
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/visual-effects-recipes.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/visual-effects-recipes.md)

## Official documentation entry points

- Universal attributes (background blur / shadow / opacity / border / transform): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-image-effect-V5
- backgroundBlurStyle: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-background-blur-style-V5
- foregroundBlurStyle: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-foreground-blur-style-V5
- shadow: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-image-effect-V5#ZH-CN_TOPIC_0000001821000841__shadow
- linearGradient: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-gradient-color-V5
- transform attributes: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-transformation-V5
- animateTo: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-explicit-animation-V5
- transition: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-transition-animation-component-V5
- Canvas / CanvasRenderingContext2D: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-components-canvas-canvas-V5

## Capability mapping

This file maps to coverage matrix rows: "UI 开发", "ArkUI 动画 / 转场 / 手势", "Canvas / 2D 绘制".

---

## Purpose

Use this file when the task is not just to understand HarmonyOS capabilities, but to **directly implement a visual effect** in ArkUI.

This file focuses on implementation recipes for common visual demo effects. The goal is:
- identify the most practical implementation path
- know which effects should use normal ArkUI properties first
- know when Canvas is a better fit
- know when ArkGraphics 3D / Component3D is actually necessary
- provide a fallback path when ideal APIs are uncertain

Official docs remain the source of truth for exact APIs. This file is the **implementation playbook**.

---

## Global rule

When implementing a visual effect in HarmonyOS, choose the first viable layer from this order:

1. **ArkUI built-in visual properties**
   - shadow
   - blur
   - backdrop blur / background blur
   - border
   - opacity
   - gradient
   - transform

2. **ArkUI animation + gesture composition**
   - animateTo
   - scale / translate / rotate
   - pan / pinch / rotate gesture

3. **Canvas / 2D drawing**
   - waveform
   - radar
   - procedural geometry
   - shape animation

4. **ArkGraphics 3D / Component3D**
   - only when the effect truly depends on scene / camera / light / model semantics

For most UI showcase effects, do **not** jump to ArkGraphics 3D first.

---

## 1. Frosted glass / glassmorphism

### Best first implementation path
Use:
- translucent background
- border
- soft shadow
- blur / backdrop blur if available in the current SDK

### Why
This gives the highest visual return with the lowest implementation risk.

### Avoid
Do not use 3D or heavy graphics APIs for normal glass cards.

### MVP recipe
- background: translucent white / tinted overlay
- border: light border with low opacity
- shadow: soft large-radius shadow
- optional blur: only if exact API is confirmed or already known to work

### Fallback
If the exact blur API is unclear, still ship the translucent + border + shadow composition.

---

## 2. Glow / neon shadow cards

### Best first implementation path
Use layered containers:
- large blurred color layer or large soft background shape
- medium highlight layer
- sharp foreground content card

### Why
A single shadow is often not enough. Layering produces a much more convincing glow effect.

### MVP recipe
- dark background
- accent glow layer
- smaller main card on top
- optional animated opacity pulse for glow

### Fallback
If blur API is uncertain, simulate glow with larger semi-transparent colored layers.

---

## 3. Gradient motion background

### Best first implementation path
Use:
- multiple gradient layers
- animated opacity
- animated translate / scale
- optional slow rotation

### Why
You usually do not need exotic APIs; layered gradients already create strong atmosphere.

### MVP recipe
- 2 to 4 gradient blobs
- different sizes
- slow independent movement
- opacity breathing

### Fallback
If direct gradient stop animation is awkward, animate multiple overlapping gradient blocks instead.

---

## 4. Spring motion demos

### Best first implementation path
Use normal ArkUI state transitions with animation APIs first.

### Good demo targets
- card pop-in
- button pulse / rebound
- bottom sheet spring-up
- list item overshoot reveal

### MVP recipe
- one toggle state
- one or more animated properties
- at least 3 contrastive spring-like examples

### Fallback
If exact spring curve support is uncertain, use the closest built-in curve and keep the demo structure the same.

---

## 5. Shared-element-like transition

### Best first implementation path
Do **not** block on true framework-level shared element support.

First implement:
- source card scale up
- source card fade out
- destination hero card fade / scale in
- matching accent colors and geometry

### Why
The UX goal is continuity, not API purity.

### When to escalate
Only look for a framework-native shared-element API if the project explicitly requires it and the simpler continuity approach is visibly insufficient.

---

## 6. 3D flip card

### Best first implementation path
Use ArkUI transforms first:
- rotateY / rotateX
- scale
- perspective-like layout setup
- shadow changes on interaction

### Why
For a flip card, 2.5D is usually enough.

### Use ArkGraphics 3D only if
- the card is part of a real scene
- the effect depends on camera and light behavior
- the user explicitly wants true 3D scene semantics

---

## 7. Parallax scroll

### Best first implementation path
Use scroll offset to drive multiple visual layers.

### MVP recipe
- 3 layers minimum
- background moves slowest
- foreground moves fastest
- combine with scale and opacity if needed

### Why
This effect is fundamentally about offset mapping, not advanced rendering.

---

## 8. Wave progress

### Best first implementation path
Use Canvas.

### Why
A waveform is procedural geometry and is cleaner in Canvas than with normal UI components.

### MVP recipe
- `progress`
- `phase`
- sine function
- clipping to container shape
- timer/frame loop to update phase

### Do not overcomplicate
Do not bring in 3D or heavy abstractions for this.

---

## 9. Gesture photo wall

### Best first implementation path
Use per-item transform state:
- x
- y
- scale
- rotation

Use gestures to update that state.

### Why
This is a transform management problem, not a graphics engine problem.

### MVP recipe
- independent item state
- drag / pinch / rotate support
- 3 to 5 sample cards or images

---

## 10. 3D carousel

### Best first implementation path
Use a 2.5D illusion first:
- translateX
- scale
- opacity
- zIndex
- slight rotateY

### Why
Most “3D carousel” demos are visually convincing without a real 3D engine.

### Use ArkGraphics 3D only if
- actual scene depth, camera motion, or light response is the point of the demo

---

## 11. Lighting / light-shadow questions

### If the user asks for “高级光影效果”
Split the problem first:

#### UI light/shadow polish
Use ArkUI-level features first:
- shadow
- blur / backdrop blur
- background blur style
- gradients
- transparent layering

#### Real scene lighting
Use ArkGraphics 3D only if the effect truly means:
- Scene
- Camera
- Light
- Component3D

### Practical rule
Most third-party app visual polish belongs to ArkUI visual properties, not full 3D scene APIs.

---

## 12. Output template for effect tasks

When answering an effect implementation request, prefer this structure:

1. **Effect classification**
   - ArkUI visual / animation / gesture / Canvas / 3D

2. **Recommended implementation layer**
   - which technical layer to use first

3. **MVP recipe**
   - concrete implementation path

4. **Fallback**
   - if exact APIs are uncertain

5. **Official verification point**
   - which official docs/category should be checked if exact API names matter
