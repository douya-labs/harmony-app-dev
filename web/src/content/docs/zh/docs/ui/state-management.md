---
title: "ArkUI State Management"
description: "Use this file when a HarmonyOS / ArkUI task involves any of:"
sidebar:
  order: 3
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/state-management.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/state-management.md)

## Purpose

Use this file when a HarmonyOS / ArkUI task involves any of:

- choosing the right state decorator (`@State`, `@Prop`, `@Link`, `@Provide`, `@Consume`, `@ObjectLink`, `@Observed`, `@Watch`)
- sharing state across components without prop-drilling
- persisting state across app launches (`PersistentStorage`)
- sharing state across UIAbility instances (`AppStorage`)
- avoiding common reactivity pitfalls (mutating arrays/objects without re-render)
- structuring complex pages so state lives at the right scope

This file is the **engineering playbook** for ArkUI state management.
It does not replace official docs; for the exact decorator semantics in the targeted SDK, always verify against the official references below.

## Capability mapping

This file maps to coverage matrix row **B2. ArkUI state management**.

## Official documentation entry points

- ArkUI state management overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-state-management-overview-V5
- @State decorator: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-state-V5
- @Prop decorator: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-prop-V5
- @Link decorator: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-link-V5
- @Provide and @Consume: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-provide-and-consume-V5
- @Observed and @ObjectLink: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-observed-and-objectlink-V5
- @Watch decorator: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-watch-V5
- AppStorage: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-appstorage-V5
- PersistentStorage: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-persiststorage-V5
- LocalStorage: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-localstorage-V5

> Decorator semantics are version-sensitive. Always confirm targeted SDK behavior, especially around nested object reactivity.

## Concept model

ArkUI state management is decorator-based. The right decorator depends on **scope** and **direction**:

### Scope axis
- **single component** — local UI state
- **parent ↔ child** — one or both directions of binding
- **page subtree** — share without explicit prop chain
- **app process** — share across pages and abilities
- **persisted across launches** — survive process death

### Direction axis
- **read-only from source** — `@Prop` (one-way down)
- **two-way binding** — `@Link` (mutates upstream)
- **nested object observability** — `@Observed` + `@ObjectLink`
- **side effect on change** — `@Watch`

### Decorator quick reference

| Decorator | Scope | Direction | Notes |
|---|---|---|---|
| `@State` | single component | own state | base building block |
| `@Prop` | parent → child | one-way (copy) | child can mutate locally without affecting parent |
| `@Link` | parent ↔ child | two-way | mutating in child mutates parent |
| `@Provide` / `@Consume` | subtree | two-way by name | skip middle components in prop chain |
| `@Observed` / `@ObjectLink` | nested object | enable deep observation | required for class instance fields to trigger re-render |
| `@Watch` | any reactive field | side effect callback | runs after state change |
| `LocalStorage` | shared across components in a UIAbility | two-way handle | scoped per UIAbility |
| `AppStorage` | shared across the whole app process | two-way handle | global single-process |
| `PersistentStorage` | persists across app launches | linked to AppStorage | backed by disk |

## Decision tree

```text
Need to manage state?
   │
   ├── only this component uses it
   │     → @State
   │
   ├── parent owns it, child only reads (or mutates locally)
   │     → @Prop
   │
   ├── parent owns it, child mutates it back
   │     → @Link
   │
   ├── multiple distant components in the same page tree
   │     → @Provide / @Consume
   │
   ├── nested object's inner field needs to trigger re-render
   │     → @Observed on class + @ObjectLink in component
   │
   ├── shared across pages in the same UIAbility
   │     → LocalStorage
   │
   ├── shared across the whole app
   │     → AppStorage
   │
   ├── must survive app launches
   │     → PersistentStorage (linked to AppStorage)
   │
   └── must survive across devices
         → distributed KV store (see persistence.md)
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — @State + @Link basic two-way

```ts
@Component
struct Counter {
  @Link value: number

  build() {
    Row() {
      Button('-').onClick(() => { this.value-- })
      Text(`${this.value}`).margin(16)
      Button('+').onClick(() => { this.value++ })
    }
  }
}

@Entry
@Component
struct Page {
  @State count: number = 0

  build() {
    Column() {
      Text(`Total: ${this.count}`)
      Counter({ value: $count })
    }
  }
}
```

`$count` is the reference syntax for `@Link`-style binding. Without `$`, the value is passed by copy.

### Pattern 2 — @Prop one-way down

```ts
@Component
struct Tag {
  @Prop label: string

  build() {
    Text(this.label).fontSize(12).padding(4)
  }
}
```

`@Prop` copies the value at bind time. Mutations inside `Tag` do not affect the parent.

### Pattern 3 — @Provide / @Consume to avoid prop drilling

```ts
@Entry
@Component
struct App {
  @Provide('theme') currentTheme: string = 'light'

  build() {
    Column() {
      DeepChild()
    }
  }
}

@Component
struct DeepChild {
  @Consume('theme') theme: string

  build() {
    Text(`Theme: ${this.theme}`)
  }
}
```

The `'theme'` key allows multiple `@Provide`s of different shapes to coexist clearly.

### Pattern 4 — @Observed + @ObjectLink for nested objects

```ts
@Observed
class Pet {
  name: string
  level: number
  constructor(name: string, level: number) {
    this.name = name
    this.level = level
  }
}

@Component
struct PetCard {
  @ObjectLink pet: Pet

  build() {
    Column() {
      Text(this.pet.name)
      Text(`Lv.${this.pet.level}`)
      Button('+1').onClick(() => { this.pet.level++ })
    }
  }
}

@Entry
@Component
struct PetsPage {
  @State pets: Pet[] = [new Pet('A', 1), new Pet('B', 2)]

  build() {
    Column() {
      ForEach(this.pets, (pet: Pet) => {
        PetCard({ pet })
      })
    }
  }
}
```

Without `@Observed` on `Pet`, mutating `pet.level` would not re-render the card.

### Pattern 5 — @Watch for side effects

```ts
@Component
struct Editor {
  @State text: string = ''
  @State charCount: number = 0

  @Watch('onTextChanged') text2 = this.text

  onTextChanged(propName: string): void {
    this.charCount = this.text.length
  }

  build() {
    Column() {
      TextArea({ text: this.text }).onChange((v) => { this.text = v })
      Text(`${this.charCount} chars`)
    }
  }
}
```

`@Watch` is the correct place for derived computations that need to run after a state change. Avoid putting expensive work directly in `build()`.

### Pattern 6 — AppStorage + PersistentStorage

```ts
import { AppStorage, PersistentStorage } from '@ohos.arkui.StateManagement'

PersistentStorage.PersistProp('user_locale', 'zh-CN')

@Entry
@Component
struct App {
  @StorageLink('user_locale') locale: string = 'zh-CN'

  build() {
    Column() {
      Text(`Locale: ${this.locale}`)
      Button('Toggle').onClick(() => {
        this.locale = this.locale === 'zh-CN' ? 'en-US' : 'zh-CN'
      })
    }
  }
}
```

- `PersistProp` registers a property as persisted; subsequent reads return the saved value
- `@StorageLink` is two-way; `@StorageProp` is read-only
- changes propagate to all components linked to the same key

### Pattern 7 — LocalStorage scoped to a UIAbility

```ts
const storage = new LocalStorage({ counter: 0 })

@Entry(storage)
@Component
struct Page {
  @LocalStorageLink('counter') counter: number = 0

  build() {
    Column() {
      Text(`${this.counter}`)
      Button('+').onClick(() => { this.counter++ })
    }
  }
}
```

`LocalStorage` is the right choice when state should be shared inside one UIAbility but not leak across abilities or persist across launches.

## Common pitfalls

### Mutating arrays/objects in place
Pushing into an `@State` array (`this.list.push(item)`) sometimes does not trigger re-render in older or specific SDK versions. Prefer reassignment: `this.list = [...this.list, item]`. For nested object fields, pair with `@Observed`.

### Forgetting `@Observed` on class fields
`@State pet: Pet = new Pet(...)` re-renders only on reassignment, not on `pet.level++`. Mark the class with `@Observed` and use `@ObjectLink` in the consumer component.

### Confusing `@Prop` and `@Link`
- `@Prop` is one-way copy; child mutations stay local
- `@Link` is two-way reference; child mutations propagate upstream
Picking the wrong one is a common reactivity bug.

### Missing `$` for `@Link` binding
`Counter({ value: this.count })` passes a copy; `Counter({ value: $count })` passes a `@Link`-compatible reference. The compiler may not flag this clearly in all SDK versions.

### Overusing `@Provide` / `@Consume`
Using `@Provide` for everything turns the app into one global namespace and hides data flow. Reserve `@Provide` / `@Consume` for genuinely cross-cutting concerns (theme, locale, current user).

### Storing huge or sensitive data in PersistentStorage
PersistentStorage is for small, non-secret state. Use RDB (see persistence.md) for large datasets and Universal Keystore for secrets.

### Mixing AppStorage and PersistentStorage carelessly
A property registered with `PersistProp` becomes a regular AppStorage entry that is also persisted. Re-reading from `AppStorage.Get` before persistence has loaded yields the default. Initialize early.

### Triggering re-render storms with @Watch chains
A `@Watch` callback that mutates other watched state can cascade. Keep watchers idempotent and short.

### Putting expensive work in build()
`build()` runs on every re-render. Move computation into `@Watch` callbacks, lifecycle hooks, or memoized properties.

## Verification checklist (before shipping ArkUI state)

1. each piece of state lives at the smallest reasonable scope
2. `@Prop` vs `@Link` chosen deliberately
3. nested object fields use `@Observed` + `@ObjectLink`
4. `$` reference syntax used for `@Link` bindings
5. `@Provide` / `@Consume` only for cross-cutting concerns
6. PersistentStorage limited to small, non-secret values
7. `@Watch` callbacks are short and idempotent
8. expensive computations are not inside `build()`
9. mutation patterns trigger re-render in the targeted SDK (verified manually if needed)
10. AppStorage / LocalStorage scope matches the actual sharing requirement

## Fallback strategies when blocked

### When reactivity does not trigger
- reassign the whole array/object instead of mutating in place
- add `@Observed` to the class and `@ObjectLink` in the consumer
- if still failing, isolate state in a smaller component to confirm the bind path

### When the right decorator is unclear
- start with `@State` + `@Link` chain; add `@Provide` only when the chain becomes painful
- start without persistence; add `PersistentStorage` after the in-memory model is correct

### When app-wide state grows complex
- consider splitting into multiple LocalStorages or AppStorage namespaces
- consider an external store pattern (a singleton class that exposes `@Observed` objects)
- avoid premature introduction of third-party state libraries

### When persisted state schema needs to change
- bump a `state_schema_version` key in PersistentStorage
- on app start, run a migration that maps old keys to new and writes back
- keep the migration idempotent

## Output expectations

When generating implementation that touches ArkUI state, the agent should:

- name the chosen decorator and explain why
- match the decorator's scope to the actual sharing need
- use `@Observed` + `@ObjectLink` for nested object reactivity
- avoid `@Provide` / `@Consume` for non-cross-cutting state
- treat PersistentStorage as small and non-secret
- mention when exact decorator semantics still need official verification for the targeted SDK
