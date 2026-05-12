---
title: "Debugging"
description: "Use this file when investigating runtime issues in a HarmonyOS app: crashes, performance regressions, layout bugs, network failures, state desync, or hard-to-reproduce defects."
sidebar:
  order: 1
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/debugging.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/debugging.md)

## Purpose

Use this file when investigating runtime issues in a HarmonyOS app: crashes, performance regressions, layout bugs, network failures, state desync, or hard-to-reproduce defects.

Covers:

- HiLog: logging discipline, levels, tags
- DevEco Studio diagnostic tools (Profiler, Inspector)
- inspecting layout, render, and state at runtime
- analyzing crashes from device logs
- tracing async flows
- isolating performance issues

This file is the **engineering playbook** for debugging.
It does not replace official docs; verify exact tool names and DevEco menu paths from the references below.

## Capability mapping

This file maps to coverage matrix row **E1. Debugging**.

## Official documentation entry points

- HiLog overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/hilog-guidelines-V5
- @ohos.hilog API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-hilog-V5
- DevEco Studio overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-overview-V5
- Profiler usage: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/devecostudio-profiler-V5
- ArkUI Inspector: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/devecostudio-arkui-inspector-V5
- Crash and exception analysis: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/faultlogger-overview-V5
- HiTrace (cross-process tracing): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/hitrace-guidelines-V5

## Concept model

### Logging is a system service, not console
HarmonyOS apps log via HiLog, not `console.log`. HiLog goes through the system log pipe with structured fields (domain, tag, level), is filterable in DevEco Studio's HiLog window, and survives across abilities.

### Three categories of issues
- **functional** — wrong behavior, wrong state, wrong output
- **performance** — slow, janky, hot device, battery drain
- **stability** — crash, hang, leak

Different tools fit different categories:

| Issue type | Primary tool |
|---|---|
| functional | HiLog + ArkUI Inspector + breakpoints |
| performance | Profiler (CPU, render, memory) |
| stability | Faultlogger / crash report + HiLog |

### Async debugging is a separate skill
Many bugs in ArkTS apps are async-shaped (race conditions, missing await, fire-and-forget errors). Tools must be paired with disciplined async hygiene (always await, always type-check rejection paths).

## Decision tree

```text
Investigating an issue?
   │
   ├── reproducible on demand
   │     → set HiLog level to DEBUG
   │     → add targeted logs at decision points
   │     → step through with breakpoints if needed
   │
   ├── intermittent
   │     → leave HiLog instrumentation running
   │     → log inputs and outcomes, not just "got here"
   │     → correlate by request id / session id
   │
   ├── slow / janky
   │     → Profiler: render frames, JS heap, CPU samples
   │     → look for long frames > 16ms
   │
   ├── crash
   │     → pull crash report from DevEco Studio
   │     → match stack trace to source map
   │     → log surrounding state via HiLog if reproducible
   │
   └── layout bug
         → ArkUI Inspector to see live tree
         → verify computed sizes vs declared
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact API names against the targeted SDK before shipping.

### Pattern 1 — HiLog wrapper

```ts
import hilog from '@ohos.hilog'

const DOMAIN = 0x1234

export const log = {
  d(tag: string, msg: string, ...args: any[]) {
    hilog.debug(DOMAIN, tag, msg, ...args)
  },
  i(tag: string, msg: string, ...args: any[]) {
    hilog.info(DOMAIN, tag, msg, ...args)
  },
  w(tag: string, msg: string, ...args: any[]) {
    hilog.warn(DOMAIN, tag, msg, ...args)
  },
  e(tag: string, msg: string, ...args: any[]) {
    hilog.error(DOMAIN, tag, msg, ...args)
  }
}
```

Notes:

- pick a project-wide `DOMAIN` so all logs filter cleanly together
- use `tag` per module (e.g., `'NET'`, `'DB'`, `'UI'`)
- never log auth tokens, passwords, or unredacted PII

### Pattern 2 — Structured event log

```ts
export function logEvent(tag: string, event: string, fields: Record<string, any>) {
  const safe = JSON.stringify(redact(fields))
  log.i(tag, `event=${event} ${safe}`)
}

function redact(fields: Record<string, any>) {
  const copy: Record<string, any> = {}
  for (const k of Object.keys(fields)) {
    if (/(token|password|secret|email|phone)/i.test(k)) {
      copy[k] = '[redacted]'
    } else {
      copy[k] = fields[k]
    }
  }
  return copy
}
```

Structured logs are far easier to correlate than free-form strings.

### Pattern 3 — Async-safe try/catch boundary

```ts
export async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn()
  } catch (e: any) {
    log.e('SAFE', `${label} failed: ${e?.message ?? e}`)
    return undefined
  }
}
```

Wrap fire-and-forget async tasks (event handlers, background updates) in `safe` to avoid unhandled rejections that vanish silently.

### Pattern 4 — Frame timing instrumentation

```ts
export function time<T>(label: string, fn: () => T): T {
  const start = Date.now()
  try {
    return fn()
  } finally {
    const ms = Date.now() - start
    if (ms > 16) log.w('PERF', `${label} took ${ms}ms`)
  }
}
```

Wrap suspicious code paths to surface slow operations without a profiler attached.

### Pattern 5 — Breadcrumb buffer for crash context

```ts
class Breadcrumbs {
  private buf: string[] = []
  private max = 50

  add(line: string) {
    this.buf.push(`${new Date().toISOString()} ${line}`)
    if (this.buf.length > this.max) this.buf.shift()
  }

  snapshot(): string[] {
    return [...this.buf]
  }
}

export const breadcrumbs = new Breadcrumbs()
```

On a caught crash, log `breadcrumbs.snapshot()` at ERROR level so the post-mortem includes the last 50 events.

### Pattern 6 — ArkUI Inspector usage

In DevEco Studio, with a debug build running on the device:

1. open the ArkUI Inspector tool window
2. select the running process
3. inspect the live component tree
4. select a component to view its computed properties (size, position, decorators)
5. compare against declared values to find layout / state bugs

This is the fastest way to debug "why is my component not where I think it is".

### Pattern 7 — Profiler workflow

To investigate a janky page:

1. start a Profiler session in DevEco Studio (CPU / Render / Memory)
2. interact with the suspected page for 5-10 seconds
3. stop the session
4. inspect the frame timeline for frames > 16ms
5. drill into the frame to see CPU samples or render breakdown
6. look for: long synchronous JS, unnecessary re-renders, large image decodes, allocations during animation

Common findings:

- decoding full-resolution images during scroll
- re-rendering large lists without keys
- expensive `build()` work that should be in `@Watch`
- unnecessary state updates from network events

## Common pitfalls

### Using `console.log`
`console.log` may not surface in HiLog or may be stripped. Always use the HiLog wrapper.

### Debug logs in release builds
Verbose HiLog at INFO+ in production fills the system buffer and exposes internals. Gate verbose logs behind a debug flag.

### Logging entire objects
`log.i('X', JSON.stringify(largeObject))` blows up the log buffer. Log only what is needed; redact PII; truncate.

### Catching and rethrowing without context
`catch (e) { throw e }` loses information. Either add context (`throw new Error(`uploadFailed: ${e.message}`)`) or handle it.

### Fire-and-forget promises
A bare `doSomethingAsync()` call without await silently drops rejections. Either await, or wrap in `safe()`.

### Breakpoints in production code without strip
Leaving `debugger` statements or breakpoint hooks in release builds can pause execution unexpectedly. Strip via build config.

### Profiler results misinterpreted on simulator
Simulator performance is unrepresentative. Always profile on a real target device.

### ArkUI Inspector confusion with stale state
Inspector shows live state. Refresh after each interaction; do not assume the tree is what you saw a minute ago.

### Crash reports without source map
Without symbol uploads / source map, crash stacks are minified and hard to read. Configure the build to retain source maps for the release build's symbol artifact.

## Verification checklist (before debug instrumentation lands in main)

1. all logs go through the HiLog wrapper
2. log levels chosen deliberately (debug vs info vs warn vs error)
3. PII redaction applied to any structured event log
4. async error boundaries cover all fire-and-forget paths
5. release build does not enable verbose logs by default
6. breadcrumbs added at user-meaningful events (page open, action, error)
7. profiler-validated on real device for any new "fast path"
8. no `debugger` / breakpoint hooks left in release
9. crash symbols / source maps retained for the release build
10. logs grouped by domain + tag for filterability

## Fallback strategies when blocked

### When the bug only repros on a user device
- ship a controlled debug build with extra HiLog instrumentation
- use telemetry (with opt-in) to ship breadcrumbs to a backend
- prepare a "report a problem" path that bundles recent logs

### When the profiler does not connect
- restart the device debug bridge
- try a smaller test app to confirm tool chain
- fall back to manual `time()` instrumentation in suspect paths

### When crash stack is unreadable
- confirm the symbol artifact matches the released versionCode
- if missing, replicate the crash in a debug build to get a readable stack

### When async order is unclear
- log entry/exit at every async boundary with a correlation id
- this is more reliable than inferring order from timestamps alone

## Output expectations

When generating debug instrumentation, the agent should:

- always go through the HiLog wrapper
- redact PII before logging
- wrap fire-and-forget async in error boundaries
- add breadcrumbs at user-meaningful events
- propose profiler use for performance work, not guesswork
- mention when exact API names still need official verification for the targeted SDK
