---
title: "Testing"
description: "Use this file when adding tests to a HarmonyOS app: unit tests, instrumentation tests (UI tests on device), or when designing the test strategy for a feature."
sidebar:
  order: 2
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/testing.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/testing.md)

## Purpose

Use this file when adding tests to a HarmonyOS app: unit tests, instrumentation tests (UI tests on device), or when designing the test strategy for a feature.

Covers:

- choosing between unit and instrumentation tests
- test file layout in a HarmonyOS module
- the official test framework's basic API shape (`describe`/`it`/expect-style)
- testing ArkTS code (pure logic) vs ArkUI components (rendered)
- test pyramid for an MVP-stage app
- avoiding common test brittleness

This file is the **engineering playbook** for testing.
It does not replace official docs; verify exact import paths and runner configuration from the references below.

## Capability mapping

This file maps to coverage matrix row **E2. Testing**.

## Official documentation entry points

- HarmonyOS test framework overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/test-framework-overview-V5
- Unit test guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ohos-test-framework-V5
- @ohos.app.ability.UIAbility (for instrumentation context): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-app-ability-uiability-V5
- DevEco Studio test running: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/devecostudio-run-test-V5
- @ohos.uitest UI test API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-uitest-V5

> Test runner module names and decorator paths have shifted across SDK versions. Always confirm against the targeted SDK.

## Concept model

### Two test layers
- **unit tests (LocalTest)** — pure logic, run on the build host or device JS engine, fast, no ArkUI rendering required
- **instrumentation tests (OhosTest)** — run on a real device or emulator, can launch a UIAbility, can drive UI via `@ohos.uitest`

### Test pyramid (MVP-friendly)

```
        ▲
        │       UI smoke (a few)
        │
        │     instrumentation (some)
        │
        │   unit tests for pure logic (many)
        ▼
```

For an MVP, **unit tests on pure logic give the best ROI**. UI tests are valuable as a thin smoke layer to catch wiring breakage.

### What to actually test
- pure functions: parsers, formatters, distance, validators, redaction
- repositories: persistence read/write round-trips with mocked context
- network clients: response parsing and error handling, mock the transport
- gesture / state reducers: pure transformations of state
- a few critical happy paths via UI smoke

### What to skip in MVP
- exhaustive component snapshot tests (brittle, low ROI)
- styling assertions
- redundant integration tests when unit tests cover the same logic

## Decision tree

```text
Adding a test?
   │
   ├── pure function / class with no ArkUI dependency
   │     → unit test
   │
   ├── repository / data layer with framework dependencies
   │     → unit test with injected fakes
   │
   ├── component renders correctly given state
   │     → unit test via small ArkTS harness when feasible
   │     → otherwise instrumentation
   │
   ├── critical happy path (login → main → action)
   │     → instrumentation smoke test
   │
   └── flaky-looking integration spanning network/DB/UI
         → reduce scope first; usually means missing seams
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact decorators and runner configuration against the targeted SDK before shipping.

### Pattern 1 — Project test layout

```
entry/
├── src/
│   ├── main/
│   │   └── ets/...           # production code
│   ├── ohosTest/             # instrumentation tests (on device)
│   │   └── ets/test/...
│   └── test/                 # local unit tests (off device)
│       └── ets/...
```

Keeping test code in dedicated source roots prevents accidental imports from production code into tests and vice versa.

### Pattern 2 — Unit test scaffold

```ts
import { describe, it, expect, beforeEach } from '@ohos/hypium'
import { distanceMeters } from '../../main/ets/utils/geo'

export default function geoTest() {
  describe('distanceMeters', () => {
    beforeEach(() => { /* setup */ })

    it('returns 0 for identical points', () => {
      const d = distanceMeters({ latitude: 1, longitude: 2, accuracy: 0 },
                               { latitude: 1, longitude: 2, accuracy: 0 })
      expect(d).assertEqual(0)
    })

    it('approximates 1 degree latitude as ~111km', () => {
      const d = distanceMeters({ latitude: 0, longitude: 0, accuracy: 0 },
                               { latitude: 1, longitude: 0, accuracy: 0 })
      expect(d > 110000 && d < 112000).assertTrue()
    })
  })
}
```

### Pattern 3 — Repository test with injected store

```ts
import { describe, it, expect } from '@ohos/hypium'
import { RecordRepository } from '../../main/ets/data/RecordRepository'

class FakeRdb {
  rows: any[] = []
  insert(_: string, v: any) { this.rows.push({ ...v, id: this.rows.length + 1 }); return this.rows.length }
  query() { return { /* fake cursor */ } as any }
  delete() { return 0 }
}

export default function repoTest() {
  describe('RecordRepository', () => {
    it('insert returns increasing ids', async () => {
      const fake = new FakeRdb()
      const repo = new RecordRepository(fake as any)
      const id1 = await repo.insert({ ts: 1, type: 'a' })
      const id2 = await repo.insert({ ts: 2, type: 'b' })
      expect(id2 > id1).assertTrue()
    })
  })
}
```

The trick is making the production code accept the dependency through a constructor or interface so a fake fits without touching the real driver.

### Pattern 4 — Mocking a network client

```ts
import { HttpClient } from '../../main/ets/net/HttpClient'

class FakeHttpClient extends HttpClient {
  constructor(private replies: Record<string, any>) {
    super({ baseUrl: 'https://example.test' })
  }
  async get<T>(path: string): Promise<T> {
    return this.replies[path] as T
  }
  async post<T>(_path: string, _body: object): Promise<T> {
    throw new Error('not implemented in fake')
  }
}
```

### Pattern 5 — UI smoke test (instrumentation)

```ts
import { describe, it, expect } from '@ohos/hypium'
import { Driver, ON } from '@ohos.UiTest'

export default function homeSmoke() {
  describe('Home smoke', () => {
    it('launches and finds main button', async () => {
      const driver = Driver.create()
      await driver.delayMs(500)
      const btn = await driver.findComponent(ON.text('打卡'))
      expect(btn !== null).assertTrue()
      await btn.click()
      await driver.delayMs(500)
      const next = await driver.findComponent(ON.text('选择品类'))
      expect(next !== null).assertTrue()
    })
  })
}
```

UI smoke is for "did the wiring break", not "is the layout pixel-perfect".

### Pattern 6 — Test entry registration

```ts
import { Hypium } from '@ohos/hypium'
import geoTest from './geoTest'
import repoTest from './repoTest'
import homeSmoke from './homeSmoke'

export default function testsuite() {
  geoTest()
  repoTest()
  homeSmoke()
}
```

A central registration point makes it easy to add and remove tests without changing build config.

## Common pitfalls

### Tests that depend on external services
A test that calls a live network endpoint is not a test. Mock the transport. Live calls go in a separate "integration" suite that runs out-of-cycle.

### UI tests with hardcoded sleeps
`delayMs(2000)` everywhere is brittle. Use `driver.findComponent` with implicit waits where possible. Sleeps should be a fallback, not a default.

### Tests that mutate shared state
Persistence tests writing to the real Preferences store leak state across tests. Use a fake store or a unique namespace per test.

### Snapshot tests for everything
Auto-snapshotting every component creates a maintenance burden far larger than the protection it gives. Use snapshots only for genuinely stable, visual-critical components.

### Tests that test the framework
`expect(typeof x === 'function')` for every function adds noise without value. Test behavior, not language semantics.

### Async tests without `await`
Returning a promise without `await` from `it(...)` may pass falsely. Always `await` async expectations.

### Unit tests requiring ArkUI rendering
If a "unit" test pulls in component rendering, it has crossed into instrumentation. Refactor the production code to expose pure logic separately.

### Ignoring flakes
A flaky test silently retried is a defect waiting to ship. Quarantine flakes immediately and fix the underlying race.

## Verification checklist (before adding tests to main)

1. test type chosen deliberately (unit vs instrumentation)
2. tests in the correct source root (`test/` vs `ohosTest/`)
3. dependencies injected so fakes fit
4. no live network calls
5. no shared mutable state across tests
6. async expectations awaited
7. UI tests use implicit waits, not raw sleeps where avoidable
8. each test name describes the behavior, not the implementation
9. failing test produces a clear actionable message
10. CI runs unit tests on every PR; instrumentation runs on a slower cadence

## Fallback strategies when blocked

### When the framework's API has shifted in target SDK
- check Release Notes for module renames (e.g., `@ohos/hypium` paths)
- start with one minimal passing test in the new SDK before porting the suite

### When a feature is hard to test in isolation
- it usually means the production code conflates concerns
- extract pure logic into a function/class before adding a test
- accept that "no test for this" is sometimes the honest answer for an MVP

### When instrumentation tests are flaky
- reduce scope (test the smallest happy path)
- prefer querying by stable text or accessibility id rather than position
- pin a stable test data fixture; do not let tests share user data with manual exploration

### When CI is slow
- split unit tests (every PR) from instrumentation (nightly)
- run instrumentation only on changes to the relevant module

## Output expectations

When generating tests, the agent should:

- prefer unit tests for pure logic
- inject dependencies so the production code stays mockable
- name each test by behavior
- await async expectations
- keep UI tests thin and behavior-focused
- mention when exact API names still need official verification for the targeted SDK
