---
title: "App Model (Stage Model)"
description: "Use this file when the task involves app structure rather than just page visuals:"
sidebar:
  order: 10
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/app-model.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/app-model.md)

Consolidated from prior HarmonyOS app model notes and official documentation directions.
Upgraded to cover the Stage model in enough depth to design a real app's structure, navigation, and lifecycle.

## Capability mapping

This file maps to coverage matrix row **A1. Application model (Stage model)**.

## Official documentation entry points

- Application Model overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/application-model-composition-V5
- Stage model basics: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/stage-model-development-overview-V5
- UIAbility lifecycle: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/uiability-lifecycle-V5
- Navigation component (recommended for new apps): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-basic-components-navigation-V5
- Router (legacy but still used): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-router-V5
- module.json5 configuration: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/module-configuration-file-V5
- app.json5 configuration: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/app-configuration-file-V5
- Want and intent: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/want-overview-V5
- Context overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/application-context-stage-V5

## Purpose

Use this file when the task involves app structure rather than just page visuals:

- planning the UIAbility / Extension structure of a new app
- understanding lifecycle hooks and what to put in each
- choosing between Navigation and Router for in-app navigation
- passing data between abilities via Want
- managing context (UIAbilityContext, ApplicationContext)

## Concept model

### Stage model in two sentences
HarmonyOS apps use the **Stage model**: an app is a bundle of one or more **modules** (entry / feature / shared library); each module exposes one or more **abilities** (UIAbility for screens, ExtensionAbility for widgets / services / form / input methods); pages live inside a UIAbility's window.

### The hierarchy

```
App (bundleName)
└── Module (entry / feature / har / hsp)
    ├── UIAbility(s)            ← screens
    │   └── window → page tree (ArkUI)
    └── ExtensionAbility(ies)
        ├── FormExtensionAbility (widget)
        ├── ServiceExtensionAbility (background service)
        ├── InputMethodExtensionAbility, ...
```

### UIAbility vs page
- a UIAbility owns a window and a page tree
- pages inside one UIAbility share the same lifecycle root
- multi-window / multi-task scenarios are typically modeled with multiple UIAbility instances

For most simple apps, **one UIAbility (EntryAbility) hosting all pages** is the right starting point.

### Three contexts an agent should distinguish
- **UIAbilityContext** — per-ability; lifetime tied to that ability instance
- **ApplicationContext** — process-wide; survives ability death
- **AbilityStageContext** — per-module; rarely accessed directly

Use UIAbilityContext for "open another page", "request permission", "start an ability"; use ApplicationContext for "global event subscription", "process-wide singletons".

### Want
- the message envelope used to start abilities, request results, or pass intents
- has `bundleName`, `abilityName`, `action`, `uri`, `parameters`
- both intra-app and cross-app calls use Want

### Navigation vs Router
- **Navigation** — component-based, declarative, integrates with ArkUI state, supports rich page-stack manipulation, recommended for new apps
- **Router** — global imperative API, simpler mental model, still works, useful for legacy code

For a new app, **default to Navigation**.

## Decision tree

```text
Designing app structure?
   │
   ├── single-screen flow with pages
   │     → 1 UIAbility + Navigation in pages
   │
   ├── needs a service that runs without UI
   │     → ServiceExtensionAbility
   │
   ├── needs a desktop widget
   │     → FormExtensionAbility (see widget-cookbook.md)
   │
   ├── multi-window / multi-task feel
   │     → multiple UIAbility instances
   │
   └── shared code across modules
         → HSP (dynamic) or HAR (static) shared library

Designing in-app navigation?
   │
   ├── new code
   │     → Navigation component
   │
   ├── legacy / very small flow
   │     → Router

Need to start another ability / app?
   │
   └── construct a Want; use UIAbilityContext.startAbility (or startAbilityForResult)
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact API names against the targeted SDK before shipping.

### Pattern 1 — UIAbility with full lifecycle

```ts
import UIAbility from '@ohos.app.ability.UIAbility'
import window from '@ohos.window'
import hilog from '@ohos.hilog'

export default class EntryAbility extends UIAbility {
  onCreate(want, launchParam) {
    hilog.info(0x0, 'EntryAbility', 'onCreate')
    // initialize app-wide singletons, restore state from launchParam
  }

  onDestroy() {
    hilog.info(0x0, 'EntryAbility', 'onDestroy')
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    windowStage.loadContent('pages/Home', (err) => {
      if (err.code) hilog.error(0x0, 'EntryAbility', `loadContent failed: ${err.message}`)
    })
  }

  onWindowStageDestroy() { hilog.info(0x0, 'EntryAbility', 'onWindowStageDestroy') }
  onForeground() { hilog.info(0x0, 'EntryAbility', 'onForeground') }
  onBackground() { hilog.info(0x0, 'EntryAbility', 'onBackground') }
}
```

Lifecycle ordering: `onCreate` → `onWindowStageCreate` → `onForeground` → `onBackground` → `onWindowStageDestroy` → `onDestroy`.

### Pattern 2 — Navigation-driven page structure

```ts
@Entry
@Component
struct Index {
  @Provide('NavStack') stack: NavPathStack = new NavPathStack()

  build() {
    Navigation(this.stack) {
      Column() {
        Button('Open Detail').onClick(() => {
          this.stack.pushPath({ name: 'Detail', param: { id: 1 } })
        })
      }
    }
    .navDestination(this.PageMap)
    .title('Home')
    .mode(NavigationMode.Stack)
  }

  @Builder
  PageMap(name: string, param: any) {
    if (name === 'Detail') {
      DetailPage({ id: param.id })
    }
  }
}

@Component
struct DetailPage {
  @Prop id: number
  @Consume('NavStack') stack: NavPathStack

  build() {
    NavDestination() {
      Column() {
        Text(`Detail ${this.id}`)
        Button('Back').onClick(() => { this.stack.pop() })
      }
    }
  }
}
```

A single `Navigation` instance with a typed map of destinations is the cleanest pattern for non-trivial apps.

### Pattern 3 — Router (legacy / simple cases)

```ts
import router from '@ohos.router'

router.pushUrl({ url: 'pages/Detail', params: { id: 1 } })
const params = router.getParams() as { id: number }
```

Use Router only when the project already standardizes on it or for very small flows.

### Pattern 4 — Start another ability with Want

```ts
import common from '@ohos.app.ability.common'
import Want from '@ohos.app.ability.Want'

export async function openSettings(context: common.UIAbilityContext) {
  const want: Want = {
    bundleName: 'com.huawei.hmos.settings',
    abilityName: 'com.huawei.hmos.settings.MainAbility'
  }
  await context.startAbility(want)
}
```

For results from another ability:

```ts
const result = await context.startAbilityForResult(want)
if (result.resultCode === 0) {
  const value = result.want?.parameters?.['someKey']
}
```

### Pattern 5 — App-wide singletons via ApplicationContext

```ts
const appCtx = AbilityStageContext.getApplicationContext()
appCtx.eventHub.on('user.signedIn', (user) => {
  // global subscriber
})

// elsewhere
appCtx.eventHub.emit('user.signedIn', { id: 'u_1' })
```

Use the application event hub for cross-page / cross-ability events without coupling pages to each other.

### Pattern 6 — Module split for a non-trivial app

```
app
├── entry            (UIAbility + main pages)
├── features/
│   ├── pet          (HAR; pet domain logic + UI)
│   ├── checkin      (HAR; check-in flow)
│   └── badges       (HAR; badge display)
└── shared/
    ├── design       (HAR; design tokens + components)
    └── core         (HAR; types, utils)
```

Promote shared logic into HAR modules once duplication appears. Avoid premature module splitting; over-modularization slows new development.

## Common pitfalls

### Doing heavy work in onCreate
`onCreate` blocks ability startup. Defer non-critical initialization (analytics, prefetch) to `onForeground` or after first frame.

### Mixing Navigation and Router in the same flow
Switching between two navigation models in the same screen creates state inconsistency. Pick one per app.

### Navigation map left in component build
Re-creating the page builder on every render thrashes Navigation state. Define the map outside `build` or as `@Builder`.

### Holding context past ability destroy
Capturing `UIAbilityContext` in a long-lived singleton causes leaks when the ability is destroyed. Use ApplicationContext for long-lived references.

### Multiple UIAbilities for what is really one app
Spawning a new UIAbility for every "modal" page complicates state and navigation. Use multiple abilities only for genuine multi-window scenarios.

### Want with wrong bundleName / abilityName
A typo causes a silent fail or "no such ability" error. Centralize Want construction; never spread literal names across files.

### EventHub for everything
Using ApplicationContext eventHub as a global mutable store hides data flow. Reserve it for genuine cross-cutting events (auth changes, session end).

### Module sprawl too early
Splitting an MVP into 6 HAR modules slows iteration and reviewing. Keep one module until structure pain is real.

## Verification checklist (before shipping a structural change)

1. Stage model used; no Legacy FA model assumptions
2. ability count justified (one per real "app surface")
3. Navigation chosen for new pages; Router only for legacy
4. lifecycle work placed in the right hook (cheap onCreate, full work onForeground)
5. context lifetime respected (no UIAbilityContext in long-lived singletons)
6. Want construction centralized
7. ApplicationContext eventHub used sparingly
8. module split justified by reuse pressure, not speculation
9. extension abilities declared in module.json5
10. all paths verified to actually exist in the build

## Fallback strategies when blocked

### When Navigation behavior is unfamiliar
- start with Router for the smallest flow
- migrate to Navigation once structure stabilizes

### When ability lifecycle issues are hard to trace
- log every lifecycle hook entry / exit (see debugging.md)
- isolate the ability with a single test page to confirm baseline behavior

### When Want fails to start a target ability
- verify bundleName / abilityName against the target's manifest
- verify signing-based access (some abilities are restricted)

### When module split causes circular dependency
- collapse the cycle by introducing a third small "shared types" module
- avoid making one module depend on the other "in both directions"

## Routing decision

For new HarmonyOS apps, prefer `Navigation` component over the older `Router` API:

- `Navigation` integrates better with declarative ArkUI
- supports rich page stack manipulation
- works with shared element transitions
- `Router` still works and is acceptable for simple cases or legacy code

Verify exact API names from official references when implementing route push/replace/back, query parameter passing, or page state restoration.

## Output expectations

When generating app-structure code or guidance, the agent should:

- name the chosen ability count and explain why
- prefer Navigation for new code
- place lifecycle work in the right hook
- centralize Want construction
- avoid premature module splitting
- mention when exact API names still need official verification for the targeted SDK
