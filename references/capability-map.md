# capability-map

Adapted from: `/home/hailei/workspace/douya-memory/shared/tech/harmonyos-capability-map.md`

## Purpose

Use this file to classify a HarmonyOS requirement before coding. The goal is not to memorize APIs, but to answer:

> Which Harmony capability domain does this request belong to, and which official documentation path should be checked next?

## Core domains most relevant to app implementation

### 1. UI development and interaction framework
Use for:
- page layout
- components
- state-driven UI
- user interaction
- general page structure

Typical requests:
- build a homepage
- create a card grid
- create an overlay or drawer
- create a custom component

### 2. Visual effects and page rendering
Use for:
- blur
- shadow
- translucency
- glow
- high-end page polish

Typical requests:
- frosted glass cards
- glow borders
- elevated shadows
- soft focus / premium page rendering

### 3. Animation and transitions
Use for:
- spring motion
- page transition
- element entrance/exit
- motion timing

Typical requests:
- spring animation
- shared-element-like transition
- fade + scale reveal
- panel slide-up transitions

### 4. Gesture interaction
Use for:
- tap / drag / pan / pinch / rotate
- interactive cards
- gesture-controlled canvases

Typical requests:
- draggable card
- photo wall with gestures
- pinch-to-zoom
- rotation with two-finger gesture

### 5. Graphics and Canvas / 2D drawing
Use for:
- Canvas
- procedural drawing
- waveform / radar / kaleidoscope-like demos
- custom drawing beyond normal components

Typical requests:
- wave progress
- custom chart-like visuals
- realtime 2D effect pages

### 6. ArkGraphics 3D / scene rendering
Use for:
- Scene / Camera / Light / Model / Component3D
- true 3D scenes
- stronger spatial light and scene composition

Typical requests:
- 3D scene showcase
- more advanced spatial presentation than 2.5D transforms can deliver

### 7. Widget
Use for:
- desktop widget / service card
- FormExtensionAbility
- widget updates and refresh policies

### 8. App model / lifecycle / routing
Use for:
- page routing
- UIAbility lifecycle
- app structure
- page organization

### 9. Media / storage / concurrency
Only pull these in if directly required by the feature.

## Practical mapping examples

### “Build a frosted glass gallery page”
Classify as:
- UI development and interaction framework
- visual effects and page rendering

### “Implement a 3D flip card”
Classify as:
- animation and transitions
- gesture interaction
- maybe ArkGraphics 3D **only if** 2.5D transforms are insufficient

### “Build a wave progress demo page”
Classify as:
- Canvas / 2D drawing
- animation

### “Build a gesture photo wall”
Classify as:
- gesture interaction
- UI layout
- maybe lightweight transforms

## Usage rule

When a Harmony task starts:
1. classify it here first
2. then read the narrowest matching reference file
3. then use official docs only for exact API verification
