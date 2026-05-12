---
title: "Animation & Gesture"
description: "Use this file when implementing ArkUI animations, transitions, and gestures. Split out from `ui-implementation-rules.md` and `visual-effects-recipes.md` for deeper coverage of the dynamic interacti…"
sidebar:
  order: 5
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/animation-and-gesture.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/animation-and-gesture.md)

## Purpose

Use this file when implementing ArkUI animations, transitions, and gestures.
Split out from `ui-implementation-rules.md` and `visual-effects-recipes.md` for deeper coverage of the dynamic interaction layer.

Covers:

- explicit and implicit animation
- spring / curve / interpolation tuning
- page transitions and shared-element-like effects
- gesture recognition and combination
- gesture conflicts and bubbling
- driving animations from gestures (drag-to-dismiss, pinch-to-zoom)

This file is the **engineering playbook** for animation + gesture work.
It does not replace official docs; verify exact curve constants and gesture priority semantics from the references below.

## Capability mapping

This file maps to coverage matrix rows **B4. Animation and transitions** and **B5. Gesture interaction**.

## Official documentation entry points

- ArkUI animation overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-animation-overview-V5
- animateTo (explicit animation): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-explicit-animation-V5
- animation attribute (implicit): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-animatorproperty-V5
- transition attribute: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-transition-animation-component-V5
- pageTransition: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-page-transition-animation-V5
- shared element transition (geometryTransition): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-transition-animation-shared-element-V5
- Curves: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-curve-V5
- Gesture overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-gesture-events-V5
- TapGesture / LongPressGesture / PanGesture / PinchGesture / RotationGesture / SwipeGesture: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-basic-gestures-tapgesture-V5

## Concept model

### Animation has two flavors
- **Implicit (`animation` attribute)** — declarative, attached to a component; any monitored attribute change is animated
- **Explicit (`animateTo`)** — imperative, you mutate state inside a callback and the resulting changes animate

Use implicit for steady visual responses to state. Use explicit for ad-hoc choreography (multiple state changes that should animate together).

### Curves and durations
- duration is in ms
- curve choices: `Linear`, `Ease`, `EaseIn`, `EaseOut`, `EaseInOut`, `FastOutSlowIn`, `FastOutLinearIn`
- spring curves via `curves.springMotion(response, dampingFraction)` for natural motion
- prefer named curves over hand-tuned bezier for consistency

### Gesture has three layers
- **Single gesture** — `TapGesture`, `LongPressGesture`, `PanGesture`, `PinchGesture`, `RotationGesture`, `SwipeGesture`
- **Combined gesture** — `GestureGroup(GestureMode.Sequence | Parallel | Exclusive, ...)`
- **Conflict resolution** — `priorityGesture` raises priority above children; `parallelGesture` allows parent and child to recognize together

### State-driving gesture
- read gesture event (offset, scale, angle)
- write to `@State` field
- ArkUI re-renders with the new style; combine with implicit `animation` for smoothing

## Decision tree

```text
Need motion?
   │
   ├── attribute change should animate automatically
   │     → implicit `.animation({...})`
   │
   ├── multiple state changes must animate as one event
   │     → explicit animateTo
   │
   ├── component appear / disappear
   │     → transition attribute + appear/disappear animations
   │
   ├── full page in / out
   │     → pageTransition
   │
   └── element flies between two pages keeping identity
         → geometryTransition (shared element)

Need user interaction?
   │
   ├── single gesture
   │     → TapGesture / PanGesture / PinchGesture / ...
   │
   ├── multiple gestures, only one should win
   │     → GestureGroup(GestureMode.Exclusive, ...)
   │
   ├── multiple gestures should recognize together (rare)
   │     → GestureGroup(GestureMode.Parallel, ...)
   │
   └── parent should win over child
         → .priorityGesture(...)
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Implicit animation on state change

```ts
@Entry
@Component
struct ToggleCard {
  @State expanded: boolean = false

  build() {
    Column() {
      Image($r('app.media.cover'))
        .width(this.expanded ? '100%' : '50%')
        .animation({
          duration: 280,
          curve: Curve.EaseInOut
        })
        .onClick(() => { this.expanded = !this.expanded })
    }
  }
}
```

### Pattern 2 — Explicit animateTo for grouped changes

```ts
@Entry
@Component
struct PetEntrance {
  @State scale: number = 0
  @State opacity: number = 0

  aboutToAppear() {
    animateTo({ duration: 360, curve: Curve.FastOutSlowIn }, () => {
      this.scale = 1
      this.opacity = 1
    })
  }

  build() {
    Image($r('app.media.pet'))
      .scale({ x: this.scale, y: this.scale })
      .opacity(this.opacity)
  }
}
```

### Pattern 3 — Spring motion (natural feel)

```ts
import curves from '@ohos.curves'

animateTo({
  duration: 600,
  curve: curves.springMotion(0.4, 0.7)
}, () => {
  this.offsetY = 0
})
```

`springMotion(response, dampingFraction)` is the right curve when an element should overshoot and settle.

### Pattern 4 — Component transition (appear / disappear)

```ts
@Component
struct Toast {
  @Prop visible: boolean

  build() {
    if (this.visible) {
      Text('Saved')
        .padding(12)
        .backgroundColor('#000')
        .fontColor('#fff')
        .borderRadius(8)
        .transition({
          type: TransitionType.Insert,
          opacity: 0,
          translate: { x: 0, y: 20 }
        })
        .transition({
          type: TransitionType.Delete,
          opacity: 0
        })
    }
  }
}
```

### Pattern 5 — Page transition

```ts
@Entry
@Component
struct DetailPage {
  build() {
    Column() {
      // page content
    }
  }

  pageTransition() {
    PageTransitionEnter({ duration: 300, curve: Curve.FastOutSlowIn })
      .slide(SlideEffect.Right)
    PageTransitionExit({ duration: 200, curve: Curve.EaseIn })
      .slide(SlideEffect.Left)
  }
}
```

### Pattern 6 — Shared element (geometryTransition)

```ts
@Component
struct ListCard {
  @State expanded: boolean = false

  build() {
    Stack() {
      Image($r('app.media.cover'))
        .geometryTransition('cover-' + this.id)
        .onClick(() => {
          animateTo({ duration: 320, curve: curves.springMotion(0.5, 0.85) }, () => {
            this.expanded = true
          })
        })
    }
  }
}
```

The same `geometryTransition('cover-' + id)` on the destination component lets ArkUI animate the transform between them.

### Pattern 7 — PanGesture driving state

```ts
@Entry
@Component
struct DragCard {
  @State offsetX: number = 0
  @State offsetY: number = 0

  build() {
    Image($r('app.media.cover'))
      .translate({ x: this.offsetX, y: this.offsetY })
      .gesture(
        PanGesture({ direction: PanDirection.All })
          .onActionUpdate((e) => {
            this.offsetX = e.offsetX
            this.offsetY = e.offsetY
          })
          .onActionEnd(() => {
            animateTo({ duration: 300, curve: curves.springMotion(0.4, 0.7) }, () => {
              this.offsetX = 0
              this.offsetY = 0
            })
          })
      )
  }
}
```

### Pattern 8 — Gesture conflict (parent priority)

```ts
@Component
struct ScrollableList {
  build() {
    Scroll() {
      Column() {
        ForEach(this.items, (item) => {
          DraggableItem({ item })
        })
      }
    }
    .priorityGesture(
      PanGesture({ direction: PanDirection.Vertical })
        .onActionUpdate(() => { /* parent scrolls */ })
    )
  }
}
```

`.priorityGesture` makes the parent's gesture preempt children's gestures.

### Pattern 9 — Pinch + rotate combined

```ts
@Component
struct PhotoView {
  @State scale: number = 1
  @State angle: number = 0

  build() {
    Image($r('app.media.photo'))
      .scale({ x: this.scale, y: this.scale })
      .rotate({ angle: this.angle })
      .gesture(
        GestureGroup(GestureMode.Parallel,
          PinchGesture()
            .onActionUpdate((e) => { this.scale = e.scale }),
          RotationGesture()
            .onActionUpdate((e) => { this.angle = e.angle })
        )
      )
  }
}
```

## Common pitfalls

### Animating layout in a fragile way
Animating `width`/`height` on a container that drives sibling layout can cause flickers. Prefer animating transform (`scale`, `translate`) which does not retrigger layout.

### Using `.animation()` for ad-hoc events
`.animation({...})` runs whenever any monitored attribute changes. Wrapping a one-off entrance with implicit animation may misfire on later state changes. Use `animateTo` for one-shot choreography.

### Hand-tuning bezier instead of named curves
`curves.cubicBezier(...)` is fine for special cases but most app motion should use named curves or `springMotion` for consistency. Hand-tuned curves often look "off" without being able to articulate why.

### Wrong gesture priority
By default, the deepest component wins. If the parent must win (e.g., a draggable parent containing a clickable child), use `.priorityGesture`. Without it, child taps will eat parent drags.

### Mixing GestureGroup modes
`GestureMode.Sequence` requires gestures in order; `Exclusive` lets only one win; `Parallel` lets all recognize. Picking the wrong mode causes either dead gestures or jittery double-recognition.

### Forgetting `onActionEnd` for drag flows
Drag-to-dismiss without a proper `onActionEnd` decision (snap back vs commit) feels broken. Always handle the end state, often with a spring animation.

### geometryTransition mismatches
The two components must share the exact same id string at the moment of transition. Mismatch silently disables the shared transition. Centralize id construction.

### Page transition with slow start
PageTransition runs after page setup. Heavy `aboutToAppear` work delays the visible animation start. Defer non-critical work via `setTimeout(..., 0)` or post-mount.

### Animating during keyboard show
Keyboard appearance triggers layout changes. Animations started during this window can stutter. Wait for keyboard settling before triggering complex motion.

## Verification checklist (before shipping motion or gestures)

1. animation type chosen deliberately (implicit vs explicit vs transition vs pageTransition)
2. duration and curve match motion intent (snappy vs settled vs playful)
3. transform-based animation preferred over layout-driven
4. spring used where overshoot/settle feels right
5. gesture priority handled when nested
6. drag flows have an explicit end state
7. shared element ids centralized and matching
8. one-shot motion uses `animateTo`, continuous uses `.animation()`
9. accessibility: motion respects reduced-motion if enabled
10. no animation reentrancy traps (an animation that triggers itself)

## Fallback strategies when blocked

### When shared element transition does not align
- fall back to "expand from card" via `animateTo` on size + position
- often visually 80% as good with much simpler code

### When a complex gesture combination misfires
- simplify to a single dominant gesture
- drop the secondary gesture or move it to a separate trigger (e.g., explicit button)

### When motion stutters on device
- replace layout-driven animation with transform-driven
- reduce duration; let the eye smooth the rest
- defer non-essential animations (e.g., decorative parallax) on weaker devices

### When pageTransition is not supported in the targeted Navigation API
- approximate with explicit `animateTo` on push/pop
- accept loss of system-managed transition orchestration

## Output expectations

When generating animation or gesture implementation, the agent should:

- name the chosen animation type with reasoning
- prefer transform over layout for animation
- use named curves or `springMotion` over hand-bezier
- handle gesture priority explicitly when nested
- always end drag flows with a defined snap-back or commit decision
- mention when exact API names still need official verification for the targeted SDK
