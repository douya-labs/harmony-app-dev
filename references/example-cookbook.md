# example-cookbook

## Purpose

Use this file when the execution environment has weak or no search capability and the agent still needs practical HarmonyOS / ArkUI implementation patterns.

This file is **not** a full API reference. It is a compact cookbook of common implementation patterns that are useful for Harmony UI work and demo apps.

When exact APIs matter, still verify against official docs if available. If search is unavailable, use these examples as implementation scaffolds rather than as guaranteed final signatures for every advanced API.

---

## 1. Demo registry pattern

Use this pattern for showcase/demo apps so the homepage and detail pages share the same metadata.

```ts
export interface DemoMeta {
  id: string
  title: string
  subtitle: string
  routeName: string
  accentColors: string[]
  codeSnippetKey: string
}

export const DEMOS: DemoMeta[] = [
  {
    id: 'frosted-gallery',
    title: '毛玻璃画廊',
    subtitle: 'backdrop blur + 透明叠层',
    routeName: 'FrostedGalleryPage',
    accentColors: ['#7F7FD5', '#86A8E7', '#91EAE4'],
    codeSnippetKey: 'frosted-gallery'
  },
  {
    id: 'glow-shadow',
    title: '光影阴影',
    subtitle: '多层彩色阴影 + 发光边缘',
    routeName: 'GlowShadowPage',
    accentColors: ['#5B86E5', '#36D1DC'],
    codeSnippetKey: 'glow-shadow'
  }
]
```

---

## 2. Homepage card pattern

Use this for a 2-column demo grid homepage.

```ts
@Component
export struct DemoCard {
  @Prop item: DemoMeta
  @Prop onTap: () => void

  build() {
    Column({ space: 12 }) {
      Stack() {
        Column()
          .width('100%')
          .height(140)
          .borderRadius(24)
          .linearGradient({
            colors: this.item.accentColors,
            angle: 135
          })
          .opacity(0.9)

        Text(this.item.title)
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(Color.White)
      }
      .width('100%')
      .height(140)

      Text(this.item.subtitle)
        .fontSize(12)
        .fontColor('#B8C0CC')
    }
    .padding(12)
    .backgroundColor('#1A1F29')
    .borderRadius(28)
    .shadow({ radius: 18, color: '#3300D2FF', offsetX: 0, offsetY: 8 })
    .onClick(() => this.onTap())
  }
}
```

---

## 3. Detail page scaffold pattern

Use this for effect pages with a bottom drawer.

```ts
@Component
export struct DemoScaffold {
  @Prop title: string
  @BuilderParam content: () => void
  @BuilderParam drawerContent: () => void

  build() {
    Stack({ alignContent: Alignment.Bottom }) {
      Column() {
        Row() {
          Button('返回')
          Text(this.title)
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
        }
        .width('100%')
        .padding(16)
        .justifyContent(FlexAlign.SpaceBetween)

        Column() {
          this.content()
        }
        .layoutWeight(1)
        .width('100%')
      }
      .width('100%')
      .height('100%')
      .backgroundColor('#0B1020')

      Column() {
        this.drawerContent()
      }
      .width('100%')
      .height('36%')
      .borderRadius({ topLeft: 24, topRight: 24 })
      .padding(16)
    }
    .width('100%')
    .height('100%')
  }
}
```

---

## 4. Frosted glass composition pattern

Use this when the exact blur API is unclear or unstable. The point is to deliver the glass look with the most stable available ArkUI composition.

```ts
Column({ space: 8 }) {
  Text('Glass Card')
    .fontSize(18)
    .fontWeight(FontWeight.Bold)
    .fontColor(Color.White)

  Text('Translucent overlay + border + shadow')
    .fontSize(12)
    .fontColor('#DDE7FF')
}
.padding(20)
.width('100%')
.borderRadius(24)
.backgroundColor('#33FFFFFF')
.border({ width: 1, color: '#55FFFFFF' })
.shadow({ radius: 20, color: '#33000000', offsetX: 0, offsetY: 8 })
```

If official blur APIs are available in the target SDK, add them. If not, keep the translucent + border + shadow fallback.

---

## 5. Glow shadow composition pattern

Use layered containers to simulate multi-layer glow when a single shadow is not enough.

```ts
Stack() {
  Column()
    .width(220)
    .height(120)
    .borderRadius(28)
    .backgroundColor('#2200E5FF')
    .blur(20)

  Column()
    .width(210)
    .height(110)
    .borderRadius(26)
    .backgroundColor('#3300E5FF')

  Column({ space: 6 }) {
    Text('Glow Card')
      .fontColor(Color.White)
      .fontSize(20)
      .fontWeight(FontWeight.Bold)
  }
  .width(200)
  .height(100)
  .borderRadius(24)
  .backgroundColor('#131A24')
}
```

If `blur()` is not available in this exact form, use opacity + larger colored background shapes as fallback.

---

## 6. Spring animation pattern

Use a boolean state to trigger a motion sequence. Exact curve names may vary by SDK, but the pattern is stable.

```ts
@State expanded: boolean = false

Button('Play')
  .onClick(() => {
    this.expanded = !this.expanded
    animateTo({ duration: 600 }, () => {
      // update animating state here
    })
  })
```

Common animated properties for demo pages:
- scale
- opacity
- translate
- rotate

If a spring-specific curve is supported in the SDK, use it. Otherwise, keep the state + animateTo structure and choose the closest available curve.

---

## 7. Gesture wall pattern

Use per-item transform state. Keep each tile independent.

```ts
interface WallItemState {
  x: number
  y: number
  scale: number
  rotation: number
}
```

Recommended pattern:
- maintain one state object per tile
- pan updates `x/y`
- pinch updates `scale`
- rotate updates `rotation`
- render each tile with translate + scale + rotate transforms

This is often more robust than trying to build a fully generic gesture abstraction too early.

---

## 8. Wave progress Canvas pattern

Use a phase value plus a progress value.

```ts
class WaveState {
  phase: number = 0
  progress: number = 0.65
}

function drawWave(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number, progress: number) {
  const baseY = height * (1 - progress)
  ctx.beginPath()
  ctx.moveTo(0, height)
  for (let x = 0; x <= width; x += 4) {
    const y = baseY + Math.sin((x / width) * Math.PI * 2 + phase) * 10
    ctx.lineTo(x, y)
  }
  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()
}
```

Animation pattern:
- update `phase` on timer / frame loop
- redraw canvas on each tick
- expose a slider or stepper for `progress`

---

## 9. Shared-transition fallback pattern

If a true shared-element API is unavailable or unclear, use this fallback sequence:

1. User taps source card
2. Source card scales up slightly
3. Source card fades while destination page fades in
4. Destination page uses the same accent color / hero card shape
5. Large hero card in detail page preserves visual continuity

This preserves the UX goal even when a framework-level shared-element transition is not available.

---

## 10. 2.5D flip-card fallback pattern

For many showcase pages, true 3D is not required.
Use:
- rotateY / rotateX
- scale
- shadow
- perspective-like layout hints

Only escalate to ArkGraphics 3D if the requested scene truly depends on Camera / Light / Scene semantics.
