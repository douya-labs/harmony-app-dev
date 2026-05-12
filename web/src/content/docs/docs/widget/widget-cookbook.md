---
title: "Widget Cookbook"
description: "Use this file when actually implementing a HarmonyOS service widget (桌面服务卡片). This is the implementation companion to `widget.md` (which is the capability-domain reminder)."
sidebar:
  order: 2
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/widget-cookbook.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/widget-cookbook.md)

## Purpose

Use this file when actually implementing a HarmonyOS service widget (桌面服务卡片).
This is the implementation companion to `widget.md` (which is the capability-domain reminder).

Covers:

- creating a widget module (FormExtensionAbility)
- defining the widget UI (subset of ArkUI)
- updating widget data (push, periodic, by-proxy)
- handling user interactions on a widget (router/call/message events)
- supporting multiple sizes (1x2, 2x2, 2x4)
- launching the host app from the widget

This file is the **engineering playbook** for widget implementation.
It does not replace official docs; for exact lifecycle hooks and event types, always verify against the official references below.

## Capability mapping

This file maps to coverage matrix row **D1. Widget / 服务卡片 (FormExtensionAbility)** — implementation depth complement to `widget.md`.

## Official documentation entry points

- Service widget overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/service-widget-overview-V5
- ArkTS widget development: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-working-principles-V5
- FormExtensionAbility lifecycle: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-lifecycle-V5
- Widget data update: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-update-by-proxy-V5
- Widget event overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-event-overview-V5
- Widget router event: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-event-router-V5
- Widget call event: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-ui-widget-event-call-V5
- @ohos.app.form.formProvider API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-app-form-formprovider-V5
- @ohos.app.form.FormExtensionAbility API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-app-form-formextensionability-V5

## Concept model

A widget runs in a different process than the host app and has constraints normal pages do not:

### 1. Two halves of every widget
- **Provider** (FormExtensionAbility) — runs in the app process, owns data and update logic
- **Renderer** (widget UI) — runs in the system widget host process, only renders the layout the provider sends

These two communicate via `formBindingData` payloads. The widget UI cannot run arbitrary ArkTS like a normal page.

### 2. Update model
- update is **push**, not reactive
- the system or the provider triggers updates; the widget does not refresh on its own
- update sources include:
  - `onUpdateForm` lifecycle (system-triggered, periodic)
  - `formProvider.updateForm` (app-triggered, push)
  - update-by-proxy (system data subscription)

### 3. Interaction model
- a widget cannot run arbitrary code on tap
- interactions are pre-declared as **events** with a fixed shape
- three event types:
  - `router` — open a UIAbility / page
  - `call` — call a method in the foreground app
  - `message` — send a message to the FormExtensionAbility

### 4. Size and form factor
- widget declares supported sizes in `form_config.json`
- common sizes: 1x2, 2x2, 2x4, 4x4
- the same widget should adapt layout per size

## Decision tree

```text
Need to build a widget?
   │
   ├── show static or rarely-changing data
   │     → onUpdateForm + low-frequency periodic update
   │
   ├── show data that changes from app activity
   │     → app calls formProvider.updateForm after data change
   │
   ├── show data that changes from system signals (battery, weather)
   │     → update-by-proxy subscription
   │
   └── handle a user tap
         ├── open the app on a specific page → router event
         ├── trigger an in-app method while app open → call event
         └── send a small payload to provider only → message event
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — module.json5 widget extension declaration

```json5
{
  "module": {
    "extensionAbilities": [
      {
        "name": "EntryFormAbility",
        "srcEntry": "./ets/entryformability/EntryFormAbility.ets",
        "label": "$string:EntryFormAbility_label",
        "description": "$string:EntryFormAbility_desc",
        "type": "form",
        "metadata": [
          {
            "name": "ohos.extension.form",
            "resource": "$profile:form_config"
          }
        ]
      }
    ]
  }
}
```

### Pattern 2 — form_config.json (widget metadata)

```json5
{
  "forms": [
    {
      "name": "widget_main",
      "description": "main widget",
      "src": "./ets/widget/pages/WidgetMain.ets",
      "uiSyntax": "arkts",
      "window": { "designWidth": 720, "autoDesignWidth": true },
      "colorMode": "auto",
      "isDefault": true,
      "updateEnabled": true,
      "scheduledUpdateTime": "10:30",
      "updateDuration": 1,
      "defaultDimension": "2*2",
      "supportDimensions": ["2*2", "2*4"]
    }
  ]
}
```

Notes:

- `updateDuration` is in 30-minute units; minimum is typically 30 minutes for periodic updates
- `supportDimensions` lists every size the widget can render
- `uiSyntax: "arkts"` is required for ArkTS widget UI

### Pattern 3 — FormExtensionAbility skeleton

```ts
import formExtensionAbility from '@ohos.app.form.FormExtensionAbility'
import formBindingData from '@ohos.app.form.formBindingData'
import formProvider from '@ohos.app.form.formProvider'

export default class EntryFormAbility extends formExtensionAbility {
  onAddForm(want) {
    const formId = want.parameters['ohos.extra.param.key.form_identity']
    const initial = formBindingData.createFormBindingData({
      title: 'Loading...',
      value: '--'
    })
    return initial
  }

  onUpdateForm(formId: string) {
    const data = this.fetchLatest()
    const binding = formBindingData.createFormBindingData(data)
    formProvider.updateForm(formId, binding)
  }

  onRemoveForm(formId: string) {
    // clean any per-formId state
  }

  onFormEvent(formId: string, message: string) {
    // 'message' is the event type from a message event in widget UI
  }

  private fetchLatest() {
    return { title: 'Title', value: '42' }
  }
}
```

### Pattern 4 — Widget UI page (subset of ArkUI)

```ts
let storage = new LocalStorage()

@Entry(storage)
@Component
struct WidgetMain {
  @LocalStorageProp('title') title: string = '--'
  @LocalStorageProp('value') value: string = '--'

  build() {
    Column() {
      Text(this.title).fontSize(14).fontColor('#666')
      Text(this.value).fontSize(28).fontWeight(FontWeight.Bold)
    }
    .width('100%').height('100%')
    .padding(12)
    .onClick(() => {
      postCardAction(this, {
        action: 'router',
        abilityName: 'EntryAbility',
        params: { from: 'widget' }
      })
    })
  }
}
```

`postCardAction` is the only way the widget UI talks back to the app.

### Pattern 5 — App pushes a widget refresh after data change

```ts
import formProvider from '@ohos.app.form.formProvider'
import formBindingData from '@ohos.app.form.formBindingData'

export async function pushWidgetUpdate(formId: string, payload: object) {
  const data = formBindingData.createFormBindingData(payload)
  await formProvider.updateForm(formId, data)
}
```

The app needs to know the active `formId`s. Persist them in `onAddForm` and remove in `onRemoveForm` (typically in Preferences, see persistence.md).

### Pattern 6 — Track active widget IDs

```ts
import preferences from '@ohos.data.preferences'

const KEY = 'active_form_ids'

export class FormIdRegistry {
  private store!: preferences.Preferences

  async init(context) {
    this.store = await preferences.getPreferences(context, 'widget_state')
  }

  async add(formId: string) {
    const ids = await this.list()
    if (!ids.includes(formId)) {
      ids.push(formId)
      await this.store.put(KEY, JSON.stringify(ids))
      await this.store.flush()
    }
  }

  async remove(formId: string) {
    const ids = (await this.list()).filter(id => id !== formId)
    await this.store.put(KEY, JSON.stringify(ids))
    await this.store.flush()
  }

  async list(): Promise<string[]> {
    const raw = (await this.store.get(KEY, '[]')) as string
    try { return JSON.parse(raw) as string[] } catch { return [] }
  }
}
```

Without this registry, the app cannot push targeted updates to widgets the user has placed.

### Pattern 7 — Multi-size adaptive layout

```ts
@Entry(storage)
@Component
struct WidgetMain {
  @LocalStorageProp('formDimension') dim: string = '2*2'

  build() {
    if (this.dim === '2*2') {
      Compact()
    } else {
      Wide()
    }
  }
}

@Component
struct Compact { build() { /* compact layout */ Column() {} } }
@Component
struct Wide { build() { /* wide layout */ Row() {} } }
```

## Common pitfalls

### Treating widget UI like a normal page
Widget UI is a strict subset of ArkUI. Many components, lifecycle hooks, async patterns, and routing APIs are not available. Stick to layout + text + image + simple click handling.

### Forgetting to register form IDs
Without persisting `formId` in `onAddForm`, the app loses track of which widgets exist and cannot push updates. Implement Pattern 6 from day one.

### Updating too frequently
`updateDuration: 1` (30 min) is a floor for periodic updates. Pushing from app on every state change is fine, but spamming `formProvider.updateForm` in tight loops triggers system throttling.

### Skipping `formBindingData` wrapping
Trying to pass raw objects to `updateForm` fails. Always wrap with `formBindingData.createFormBindingData`.

### Missing `postCardAction` action type
`action` must be exactly `'router'`, `'call'`, or `'message'`. Typos result in silent no-op interactions.

### Heavy work in `onUpdateForm`
The provider has limited time to respond. Long network calls or heavy computation on the provider thread cause missed updates. Pre-compute or fetch in the foreground app, then push.

### Assuming the widget is always visible
Users add and remove widgets at any time. Treat all widget state as derivative; the app must be able to recreate the widget payload from app state at any moment.

### Forgetting dark mode
Widgets render on the home screen with the system theme. Use system colors / `colorMode: "auto"` and verify both light and dark.

### Wrong `uiSyntax`
`uiSyntax: "hml"` is the legacy widget syntax. New widgets should use `uiSyntax: "arkts"`. Mixing them in the same module is error-prone.

## Verification checklist (before shipping a widget)

1. `form_config.json` declares all supported dimensions
2. `uiSyntax` is `"arkts"` for new widgets
3. FormExtensionAbility implements `onAddForm` / `onUpdateForm` / `onRemoveForm`
4. active form IDs persisted on add and removed on remove
5. all UI updates wrapped via `formBindingData.createFormBindingData`
6. all interactions use `postCardAction` with valid action types
7. router event lands on a sensible page with passed parameters honored
8. multi-size layout adapts cleanly
9. dark mode rendering checked
10. no heavy work on the provider thread

## Fallback strategies when blocked

### When ArkTS widget syntax is too restrictive for an effect
- simplify the visual design; widgets are not the place for complex animation
- move the rich version into the app and keep the widget glanceable

### When push updates from app feel unreliable
- add a fallback periodic update via `updateDuration`
- log push attempts via HiLog and verify formId list integrity

### When user interactions feel laggy
- prefer `router` (open app) over `call` (which requires the app to already be foreground)
- pre-warm the destination page if cold start is slow

## Output expectations

When generating widget implementation, the agent should:

- declare the widget extension and `form_config.json` correctly
- separate provider and renderer concerns
- always wrap update payloads with `formBindingData`
- always register form IDs for later targeted updates
- handle multi-size and dark mode
- mention when exact API names still need official verification for the targeted SDK
