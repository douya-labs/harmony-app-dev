---
title: "Concurrency (TaskPool / Worker)"
description: "Use this file when a HarmonyOS task needs background computation, parallelism, or async coordination beyond a simple `await`. Topics include TaskPool, Worker, async hygiene, and choosing the right …"
sidebar:
  order: 6
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/concurrency.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/concurrency.md)

## Purpose

Use this file when a HarmonyOS task needs background computation, parallelism, or async coordination beyond a simple `await`. Topics include TaskPool, Worker, async hygiene, and choosing the right concurrency primitive.

Covers:

- TaskPool vs Worker
- moving heavy work off the UI thread
- passing data across thread boundaries
- canceling, timing out, and limiting concurrency
- async pitfalls in ArkTS

This file is the **engineering playbook** for concurrency.
It does not replace official docs; verify exact module paths and serializability rules from the references below.

## Capability mapping

This file maps to coverage matrix row **C11. Concurrency**.

## Official documentation entry points

- Concurrency overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/concurrency-overview-V5
- TaskPool guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/taskpool-introduction-V5
- @ohos.taskpool API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-taskpool-V5
- Worker guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/worker-introduction-V5
- @ohos.worker API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-worker-V5

## Concept model

### Two primary primitives
- **TaskPool** — high-level, system-managed pool of worker threads; submit a function and get a Promise; ideal for short bursty work
- **Worker** — long-lived dedicated worker thread; bidirectional message channel; ideal for sustained work or stateful workers

| Need | Right tool |
|---|---|
| short, stateless heavy work | TaskPool |
| long-lived background loop | Worker |
| many small parallel tasks | TaskPool |
| pipeline with state | Worker |

### Thread boundary rules
- only **transferable** or **serializable** data can cross thread boundaries
- ArkUI components, system contexts, and many platform handles are **not** transferable
- the safest pattern is to pass plain JSON-shaped objects, numbers, and strings

### Async hygiene
- always `await` promises that produce side effects
- always handle rejection (try/catch or `.catch`)
- avoid creating unbounded numbers of pending tasks

## Decision tree

```text
Need to offload work?
   │
   ├── one-off heavy compute (parse, hash, decode)
   │     → TaskPool
   │
   ├── many small parallel tasks (batch processing)
   │     → TaskPool with concurrency limit
   │
   ├── long-lived background work (subscription, periodic worker)
   │     → Worker
   │
   ├── needs system context (camera, storage, UI)
   │     → keep on main thread; offload only the pure compute
   │
   └── multiple workers coordinating
         → message-passing through Workers; keep state in one place
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact API names against the targeted SDK before shipping.

### Pattern 1 — TaskPool one-shot

```ts
import taskpool from '@ohos.taskpool'

@Concurrent
function hashHeavy(input: string): string {
  // pure function, runs on a worker thread
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 131 + input.charCodeAt(i)) >>> 0
  return h.toString(16)
}

export async function hashAsync(input: string): Promise<string> {
  return taskpool.execute(hashHeavy, input) as Promise<string>
}
```

The `@Concurrent` decorator marks a function as eligible for TaskPool execution. The function must be pure: no closures over outer scope, no DOM/UI access.

### Pattern 2 — TaskPool with explicit Task object

```ts
const task = new taskpool.Task(hashHeavy, 'some-large-string')
const result = await taskpool.execute(task)
```

Use the explicit Task when you want to set priority or cancel.

### Pattern 3 — Concurrency limiter

```ts
export class Limiter {
  private active = 0
  private queue: (() => void)[] = []

  constructor(private max: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve))
    }
    this.active++
    try {
      return await fn()
    } finally {
      this.active--
      const next = this.queue.shift()
      if (next) next()
    }
  }
}
```

Useful for rate-limiting parallel network requests or parallel taskpool dispatches.

### Pattern 4 — Worker setup

In the project, declare a worker file (e.g., `entry/src/main/ets/workers/MyWorker.ts`):

```ts
// MyWorker.ts
import worker from '@ohos.worker'

const w = worker.workerPort
w.onmessage = (e) => {
  const data = e.data
  if (data.type === 'compute') {
    const out = doWork(data.payload)
    w.postMessage({ id: data.id, result: out })
  }
}

function doWork(payload: any): any {
  // heavy work
  return payload
}
```

Then on the main thread:

```ts
import worker from '@ohos.worker'

export class HeavyWorker {
  private w: worker.ThreadWorker
  private nextId = 1
  private pending = new Map<number, (v: any) => void>()

  constructor() {
    this.w = new worker.ThreadWorker('entry/ets/workers/MyWorker.ts')
    this.w.onmessage = (e) => {
      const { id, result } = e.data
      const cb = this.pending.get(id)
      if (cb) {
        cb(result)
        this.pending.delete(id)
      }
    }
  }

  call(payload: any): Promise<any> {
    const id = this.nextId++
    return new Promise((resolve) => {
      this.pending.set(id, resolve)
      this.w.postMessage({ id, type: 'compute', payload })
    })
  }

  release() {
    this.w.terminate()
  }
}
```

Always release the worker when done; idle workers cost memory.

### Pattern 5 — Timeout wrapper

```ts
export async function withTimeout<T>(p: Promise<T>, ms: number, label = 'op'): Promise<T> {
  let timer: number = 0
  const t = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([p, t])
  } finally {
    clearTimeout(timer)
  }
}
```

Use to bound any task that should not block forever (TaskPool jobs, Worker calls, network).

### Pattern 6 — Cancellation token

```ts
export class Cancel {
  private cancelled = false
  private listeners: (() => void)[] = []

  cancel() {
    if (this.cancelled) return
    this.cancelled = true
    this.listeners.forEach(l => l())
  }

  isCancelled() { return this.cancelled }

  onCancel(fn: () => void) { this.listeners.push(fn) }
}

export async function cancellable<T>(token: Cancel, fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (token.isCancelled()) return reject(new Error('cancelled'))
    token.onCancel(() => reject(new Error('cancelled')))
    fn().then(resolve, reject)
  })
}
```

Cooperative cancellation lets long-running pipelines exit early when the user navigates away.

## Common pitfalls

### Closure capture in @Concurrent functions
A `@Concurrent` function cannot capture outer variables. Trying to use a captured variable causes runtime errors that are confusing to read. Pass everything as arguments.

### Non-serializable arguments
Passing class instances with methods, functions, or platform handles to TaskPool / Worker silently strips behavior. Pass plain data; reconstruct on the worker side.

### Forgetting to terminate Workers
Workers persist until terminated. Forgetting to release them on page leave causes memory bloat across navigation.

### Tight error swallowing
`taskpool.execute(fn).catch(() => {})` hides real bugs. Log the error at minimum; surface in UI when meaningful.

### Unbounded parallelism
Firing 1000 TaskPool jobs in parallel may hurt rather than help. Use a limiter for batch work.

### Using Worker for trivial work
Spinning up a Worker for a 10ms function costs more than it saves. Reserve Workers for sustained or heavy work.

### Doing UI updates from a worker
Worker results reach the main thread via `onmessage`. Do all UI updates on the main thread, never directly from a worker context.

### Race conditions in shared state
`@State` mutations from multiple async paths can interleave. Centralize updates through a small reducer or single async pipeline; avoid concurrent writes to the same state.

### Forgetting timeouts
A TaskPool job that hangs (e.g., infinite loop in poorly written code) holds a worker forever. Always wrap in `withTimeout` for known-bounded operations.

## Verification checklist (before shipping concurrency)

1. correct primitive chosen (TaskPool vs Worker vs plain async)
2. all `@Concurrent` functions are pure (no closures, no UI access)
3. only serializable arguments cross thread boundaries
4. workers terminated on disposal
5. parallel batches use a limiter
6. errors logged, not swallowed
7. timeouts wrap any operation that could hang
8. cancellation paths exist for long-running pipelines
9. shared state has a single owner
10. UI updates only on main thread

## Fallback strategies when blocked

### When TaskPool is unavailable in the target SDK
- fall back to plain async; profile to confirm it is not a real bottleneck
- consider Worker if the work is sustained

### When data is not serializable
- restructure: keep the non-serializable handle on the main thread, pass only the serializable inputs to the worker

### When parallelism does not improve speed
- profile first; the bottleneck may be I/O, not CPU
- check that `@Concurrent` functions are actually doing CPU-bound work

### When Worker setup is too heavy for an MVP
- start with TaskPool one-shots
- introduce Worker only when sustained workload is confirmed

## Output expectations

When generating concurrency code, the agent should:

- pick the primitive deliberately, with reasoning
- mark TaskPool functions `@Concurrent` and keep them pure
- pass only serializable data across boundaries
- always release Worker on disposal
- always wrap potentially hanging ops with timeout
- mention when exact API names still need official verification for the targeted SDK
