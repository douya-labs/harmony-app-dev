---
title: "Background Tasks"
description: "Use this file when a HarmonyOS task needs work to continue beyond the foreground UIAbility lifecycle: short transient operations (finishing an upload), long tasks with explicit reasons (audio playb…"
sidebar:
  order: 5
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/background-tasks.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/background-tasks.md)

## Purpose

Use this file when a HarmonyOS task needs work to continue beyond the foreground UIAbility lifecycle: short transient operations (finishing an upload), long tasks with explicit reasons (audio playback, navigation), or scheduled / agent-driven work.

Covers:

- the official background task model (transient vs long task vs agent)
- choosing the right background mode
- triggering, monitoring, and ending background work
- power management constraints
- AppGallery review considerations for background features

This file is the **engineering playbook** for background work.
It does not replace official docs; verify the exact background task types and ServiceExtensionAbility patterns from the references below.

## Capability mapping

This file maps to coverage matrix row **C7. Background tasks**.

## Official documentation entry points

- Background task overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/background-task-overview-V5
- Transient task guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/transient-task-V5
- Long-running task guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/continuous-task-V5
- @ohos.resourceschedule.backgroundTaskManager API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-resourceschedule-backgroundtaskmanager-V5
- Reminder Agent (scheduled): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/reminderagent-overview-V5
- Service Extension Ability (background service): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/serviceextensionability-V5
- Power consumption considerations: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/efficiency-resources-rules-V5

## Concept model

### Three background "shapes"
- **Transient task** — short window after the app moves to background to finish an in-flight piece of work (e.g., last upload chunk); time-limited
- **Continuous task (long task)** — declared, justified background work in a fixed list of categories (audio, navigation, location, data transfer, …); UI indicator typically required
- **Agent / scheduled** — system fires the app at a future time (Reminder Agent, scheduled tasks)

| Need | Right shape |
|---|---|
| flush a pending request after backgrounding | transient |
| play music while screen is off | continuous (audio) |
| run navigation while screen is off | continuous (location) |
| sync once a day | agent / scheduled |
| arbitrary background loop "for the user's convenience" | not allowed; redesign |

### What HarmonyOS does NOT allow
- arbitrary background loops without a declared category
- silent background polling for trivial reasons
- evading the system power scheduler

Designing around foreground-only is the safest baseline; treat any background request as a special-case decision.

### Service Extension Ability
- a `ServiceExtensionAbility` is the right place to host a long-running background task
- it has its own lifecycle and is invoked via `Want`
- not all background scenarios need a Service Extension; transient and short tasks can live in a UIAbility

## Decision tree

```text
Need work in background?
   │
   ├── short, in-flight work to finish
   │     → backgroundTaskManager.requestSuspendDelay (transient)
   │     → cancel ASAP
   │
   ├── long work with a clear category (audio, location, ...)
   │     → backgroundTaskManager.startBackgroundRunning (continuous)
   │     → typically needs UI indicator
   │
   ├── periodic / future trigger
   │     → reminderAgentManager (see notification.md)
   │     → or workScheduler / agent for system-managed scheduling
   │
   └── arbitrary background loop
         → not allowed; rethink design
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact API names against the targeted SDK before shipping.

### Pattern 1 — Request a transient task

```ts
import backgroundTaskManager from '@ohos.resourceschedule.backgroundTaskManager'

export async function withTransient<T>(
  context,
  reason: string,
  fn: () => Promise<T>
): Promise<T> {
  const wantAgentInfo = { /* see wantAgent docs in notification.md */ }
  const info = await backgroundTaskManager.requestSuspendDelay(reason, () => {
    // called when the system is about to revoke the delay
  })
  try {
    return await fn()
  } finally {
    await backgroundTaskManager.cancelSuspendDelay(info.requestId)
  }
}
```

Always cancel as soon as the work is done. Holding a transient task longer than needed will be revoked or counted against the app's quota.

### Pattern 2 — Continuous task (audio)

```ts
import backgroundTaskManager from '@ohos.resourceschedule.backgroundTaskManager'
import wantAgent from '@ohos.app.ability.wantAgent'

export async function startAudioBackground(context): Promise<void> {
  const agent = await wantAgent.getWantAgent({
    wants: [{
      bundleName: 'com.example.app',
      abilityName: 'EntryAbility'
    }],
    operationType: wantAgent.OperationType.START_ABILITY,
    requestCode: 0
  })
  await backgroundTaskManager.startBackgroundRunning(
    context,
    backgroundTaskManager.BackgroundMode.AUDIO_PLAYBACK,
    agent
  )
}

export async function stopAudioBackground(context): Promise<void> {
  await backgroundTaskManager.stopBackgroundRunning(context)
}
```

The category (`AUDIO_PLAYBACK`) must match the actual work; using audio for non-audio purposes will be flagged.

### Pattern 3 — Service Extension Ability skeleton

```ts
// SyncServiceAbility.ts
import ServiceExtensionAbility from '@ohos.app.ability.ServiceExtensionAbility'

export default class SyncServiceAbility extends ServiceExtensionAbility {
  onCreate() { /* setup */ }
  onRequest(want, startId) {
    // handle a one-shot service request
  }
  onConnect(want) {
    // return a remote object for ipc, or null
    return null
  }
  onDestroy() { /* cleanup */ }
}
```

Declare in `module.json5`:

```json5
{
  "module": {
    "extensionAbilities": [
      {
        "name": "SyncServiceAbility",
        "srcEntry": "./ets/services/SyncServiceAbility.ets",
        "type": "service",
        "exported": false
      }
    ]
  }
}
```

Use the service for explicit background needs; do not turn every async into a service.

### Pattern 4 — Scheduled work via Reminder Agent

See `notification.md` Pattern 5 for daily reminder. The Reminder Agent is the right path when the trigger is time-based and must survive process death.

### Pattern 5 — Foreground-first with graceful pause

```ts
@Component
struct UploadFlow {
  @State isUploading: boolean = false
  @State pendingChunks: number = 0

  async startUpload(items: any[]) {
    this.isUploading = true
    for (const item of items) {
      await this.uploadOne(item)
    }
    this.isUploading = false
  }

  // optional: if backgrounded, request a transient extension to finish current chunk
  async onAppBackground() {
    if (!this.isUploading) return
    await withTransient(getContext(), 'finish current upload', async () => {
      // continue current chunk; remaining will resume on next foreground
    })
  }
}
```

Designing for "may pause and resume" is more robust than fighting for background time.

## Common pitfalls

### Using continuous task for the wrong category
Declaring `AUDIO_PLAYBACK` to keep a network sync alive will be flagged in review. Categories must match the actual work.

### Forgetting to cancel
A held transient task that is not canceled may be force-revoked, and counts against quota. Always cancel in `finally`.

### Tight loops in background
A background loop polling every 100ms wastes battery and triggers system throttling. Use scheduled triggers or push.

### Service Extension that never stops
A service that holds resources after the work is done blocks system optimization. Always implement `onDestroy` cleanup and stop the service when idle.

### Assuming background continues across reboot
After a reboot, in-flight background tasks are not resumed. Persist enough state to resume from the last completed step.

### Ignoring power state
On low-battery / power-save mode, background work may be deferred or canceled. Treat completion as best-effort, not guaranteed.

### Background location without LOCATION_IN_BACKGROUND
See `location.md`. Without the right permission and category, background location silently stops working.

### Skipping UI indicator for continuous tasks
Some categories require a visible indicator (e.g., active notification, status bar icon). Hiding it draws review attention.

## Verification checklist (before shipping background work)

1. correct shape chosen (transient vs continuous vs scheduled vs not-allowed)
2. continuous category matches actual work
3. transient tasks always canceled
4. UI indicator present for continuous tasks where required
5. service extension implements onDestroy cleanup
6. no tight polling loops
7. design works correctly in low-power mode (best-effort)
8. resume-from-state works after process death
9. AppGallery review notes prepared for any continuous task category
10. foreground-first path also works (background is enhancement, not requirement)

## Fallback strategies when blocked

### When background time is denied / revoked
- accept partial progress
- on next foreground, detect partial state and resume

### When the right category is unclear
- if in doubt, assume background is not allowed and design foreground-only
- only escalate to continuous when a real user-visible feature requires it

### When system throttles a continuous task
- batch work to do more per active window
- reduce frequency
- consider whether the feature truly needs to run continuously

## Output expectations

When generating background-task code, the agent should:

- pick the right shape with reasoning
- match continuous category to actual work
- always cancel transient tasks in finally
- design the foreground-first path first
- treat background completion as best-effort
- mention when exact API names still need official verification for the targeted SDK
