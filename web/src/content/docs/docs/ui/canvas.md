---
title: "Canvas (2D Drawing)"
description: "Use this file when implementing 2D drawing in HarmonyOS via the `Canvas` component and `CanvasRenderingContext2D`. Split out from `visual-effects-recipes.md` for deeper coverage of procedural drawing."
sidebar:
  order: 6
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/canvas.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/canvas.md)

## Purpose

Use this file when implementing 2D drawing in HarmonyOS via the `Canvas` component and `CanvasRenderingContext2D`.
Split out from `visual-effects-recipes.md` for deeper coverage of procedural drawing.

Covers:

- when Canvas is the right tool vs declarative components
- coordinate system, units, and DPI handling
- paths, fills, strokes, gradients, shadows
- text rendering on Canvas
- image drawing and clipping
- animating Canvas via `requestAnimationFrame`
- offscreen canvas for performance
- common pitfalls (HiDPI blurriness, redraw storms)

This file is the **engineering playbook** for Canvas / 2D drawing.
It does not replace official docs; verify exact context method names from the references below.

## Capability mapping

This file maps to coverage matrix row **B6. Canvas / 2D drawing**.

## Official documentation entry points

- Canvas component: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-components-canvas-canvas-V5
- CanvasRenderingContext2D: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-canvasrenderingcontext2d-V5
- Path2D: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-components-canvas-path2d-V5
- ImageBitmap: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-components-canvas-imagebitmap-V5
- OffscreenCanvas: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-components-canvas-offscreencanvas-V5
- ArkUI animation overview (for driving canvas redraw): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-animation-overview-V5

## Concept model

### Canvas vs declarative components
- declarative components (`Image`, `Shape`, `Polyline`, `Rect`, `Circle`) are reactive and compose well; prefer them for static-ish shapes
- Canvas is procedural; reach for it when the visual:
  - is procedurally generated per-frame (waveform, particle, simulation)
  - depends on many points or computed paths
  - needs custom blending or per-pixel control
  - cannot be cleanly expressed with a fixed component tree

### Coordinate system
- origin is top-left
- units are vp (virtual pixels); the context has its own internal coordinate space
- the canvas surface has a logical size and a physical pixel size; mismatched handling is the #1 cause of blur

### Drawing model
- the context is stateful: `fillStyle`, `strokeStyle`, `lineWidth`, transformations all persist until changed
- save/restore via `save()` / `restore()` to scope state changes
- paths are accumulated via `beginPath` → `moveTo` / `lineTo` / `arc` / etc → `fill` / `stroke` / `closePath`

### Redraw model
- Canvas does not auto-redraw on state change
- you redraw inside `onReady` or via callbacks that re-invoke draw functions
- for animation, drive redraw with `requestAnimationFrame` or react to `@State` change inside a draw function call

## Decision tree

```text
Need 2D drawing?
   │
   ├── one-shot static shape
   │     → declarative Shape / Circle / Polyline (not Canvas)
   │
   ├── parametric shape that changes with state
   │     → declarative if expressible, else Canvas
   │
   ├── per-frame procedural (wave, particles, custom chart)
   │     → Canvas with requestAnimationFrame
   │
   ├── heavy off-thread rendering (rare)
   │     → OffscreenCanvas
   │
   └── pixel-level effect
         → Canvas with ImageData manipulation
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Minimal Canvas setup

```ts
@Entry
@Component
struct CanvasDemo {
  private settings: RenderingContextSettings = new RenderingContextSettings(true)
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings)

  build() {
    Canvas(this.context)
      .width('100%')
      .height(200)
      .backgroundColor('#FAFAFA')
      .onReady(() => { this.draw() })
  }

  private draw() {
    const ctx = this.context
    ctx.clearRect(0, 0, ctx.width, ctx.height)
    ctx.fillStyle = '#3366FF'
    ctx.fillRect(20, 20, 80, 80)
  }
}
```

`onReady` fires once the canvas is laid out and the context has valid dimensions. Always draw from there.

### Pattern 2 — Path-based shape

```ts
private drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.moveTo(0, size * 0.3)
  ctx.bezierCurveTo(size, -size * 0.5, size * 1.5, size * 0.3, 0, size)
  ctx.bezierCurveTo(-size * 1.5, size * 0.3, -size, -size * 0.5, 0, size * 0.3)
  ctx.closePath()
  ctx.fillStyle = '#FF4D6A'
  ctx.fill()
  ctx.restore()
}
```

### Pattern 3 — Linear and radial gradient

```ts
const linear = ctx.createLinearGradient(0, 0, 0, ctx.height)
linear.addColorStop(0, '#FFAA00')
linear.addColorStop(1, '#FF4D6A')
ctx.fillStyle = linear
ctx.fillRect(0, 0, ctx.width, ctx.height)

const radial = ctx.createRadialGradient(100, 100, 10, 100, 100, 80)
radial.addColorStop(0, 'rgba(255,255,255,0.9)')
radial.addColorStop(1, 'rgba(255,255,255,0)')
ctx.fillStyle = radial
ctx.fillRect(20, 20, 160, 160)
```

### Pattern 4 — Animated wave via requestAnimationFrame

```ts
@Entry
@Component
struct WaveDemo {
  private settings: RenderingContextSettings = new RenderingContextSettings(true)
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings)
  private rafId: number = 0
  private startTime: number = 0

  aboutToDisappear() {
    cancelAnimationFrame(this.rafId)
  }

  build() {
    Canvas(this.context)
      .width('100%').height(160)
      .onReady(() => {
        this.startTime = Date.now()
        this.tick()
      })
  }

  private tick = () => {
    this.draw()
    this.rafId = requestAnimationFrame(this.tick)
  }

  private draw() {
    const ctx = this.context
    const W = ctx.width
    const H = ctx.height
    const t = (Date.now() - this.startTime) / 1000
    ctx.clearRect(0, 0, W, H)
    ctx.beginPath()
    ctx.moveTo(0, H / 2)
    for (let x = 0; x <= W; x++) {
      const y = H / 2 + Math.sin((x / W) * Math.PI * 4 + t * 2) * 20
      ctx.lineTo(x, y)
    }
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = '#3366FF'
    ctx.fill()
  }
}
```

Always cancel the RAF in `aboutToDisappear` to avoid runaway loops on page exit.

### Pattern 5 — Drawing text with measured layout

```ts
ctx.font = '20vp sans-serif'
ctx.fillStyle = '#222'
const text = 'Hello'
const metrics = ctx.measureText(text)
const tx = (ctx.width - metrics.width) / 2
const ty = ctx.height / 2
ctx.fillText(text, tx, ty)
```

Center text by measuring; never assume font metrics.

### Pattern 6 — Clipping

```ts
ctx.save()
ctx.beginPath()
ctx.arc(100, 100, 80, 0, Math.PI * 2)
ctx.clip()
// subsequent drawing is clipped to the circle
ctx.fillStyle = '#FF4D6A'
ctx.fillRect(0, 0, 200, 200)
ctx.restore()
```

### Pattern 7 — Drawing an image

```ts
const img = new ImageBitmap('/common/images/cover.png')
img.addEventListener('load', () => {
  ctx.drawImage(img, 0, 0, ctx.width, ctx.height)
})
```

`ImageBitmap` decodes asynchronously. Always wait for `load` before drawing.

### Pattern 8 — OffscreenCanvas for heavy render

```ts
const off = new OffscreenCanvas(ctx.width, ctx.height)
const offCtx = off.getContext('2d')
// ... do many draw calls into offCtx
const bitmap = off.transferToImageBitmap()
ctx.drawImage(bitmap, 0, 0)
```

Useful when one frame of compositing has many draw calls, especially when the result is mostly static.

## Common pitfalls

### Blurry canvas on HiDPI screens
Drawing with logical sizes only causes blur on dense screens. Pass `RenderingContextSettings(true)` to enable anti-alias and use the natural `ctx.width` / `ctx.height` returned values which already account for the canvas's effective resolution. Verify visually on real device.

### Drawing before `onReady`
The context's width/height are not valid until `onReady` fires. Drawing earlier produces wrong dimensions and silent layout bugs.

### Forgetting to clear before re-draw
Animated canvases must clear the previous frame (`ctx.clearRect(0, 0, W, H)`) or content stacks endlessly. For partial re-draw, use a clipping region.

### Forgetting save / restore around transforms
`translate`, `rotate`, `scale` mutate the context state. Without `save()` / `restore()` around scoped transforms, later drawing inherits unexpected offsets.

### Path accumulation across draws
Without `beginPath()` at the start of each new path, `fill` / `stroke` includes everything from previous paths. Always `beginPath()`.

### Runaway requestAnimationFrame
Without `cancelAnimationFrame` in `aboutToDisappear`, the loop continues after the page is gone, wasting CPU and battery.

### Heavy work in the draw loop
Allocating arrays, parsing JSON, or doing trigonometry per pixel inside RAF tanks frame rate. Pre-compute and cache.

### Treating ImageBitmap synchronously
`new ImageBitmap(...)` returns immediately, but the bitmap is not loaded. Always wait for the `load` event before `drawImage`.

### Wrong text baseline
`fillText(text, x, y)` draws with the baseline at `y` by default. Use `ctx.textBaseline = 'top' | 'middle' | 'bottom'` to control vertical alignment.

### Mixing declarative components into Canvas
The Canvas component cannot host declarative ArkUI children inside its drawing area. Stack ArkUI elements above Canvas with `Stack`, do not try to nest them inside the canvas.

## Verification checklist (before shipping a Canvas feature)

1. drawing happens inside `onReady`
2. `RenderingContextSettings(true)` enabled for anti-aliasing
3. `clearRect` called at the start of each frame
4. `save()` / `restore()` around scoped transforms
5. `beginPath()` starts every new path
6. `requestAnimationFrame` paired with `cancelAnimationFrame` on disappear
7. heavy work moved out of the draw loop
8. `ImageBitmap` waits for `load`
9. text measured before centering
10. visual verified on a HiDPI device, not just simulator

## Fallback strategies when blocked

### When the visual can be expressed declaratively
- prefer `Shape`, `Circle`, `Polyline`, `Path` declarative components
- they are easier to animate and integrate with state

### When OffscreenCanvas is unavailable in the target SDK
- pre-render the static parts to a bitmap once and drawImage it each frame
- skip the offscreen optimization; profile first, optimize second

### When animation chokes on weak devices
- reduce frame rate to 30fps via timestamp gating in the RAF callback
- reduce path point density
- replace shadow-heavy drawing with pre-blurred bitmaps

## Output expectations

When generating Canvas implementation, the agent should:

- explain why Canvas is preferred over declarative components for the case
- always set up via `onReady`
- always clear before each animated frame
- always cancel RAF on disappear
- save/restore scoped transforms
- mention when exact API names still need official verification for the targeted SDK
