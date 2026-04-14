# graphics-3d

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
