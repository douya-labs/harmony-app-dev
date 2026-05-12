---
title: "Notifications"
description: "Use this file when a HarmonyOS task involves any of:"
sidebar:
  order: 4
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/notification.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/notification.md)

## Purpose

Use this file when a HarmonyOS task involves any of:

- showing a system notification (text, image, progress)
- scheduling a future notification (reminder at a specific time)
- managing notification channels / slots
- handling user actions on a notification (tap, button)
- showing badges on the app icon
- requesting notification permission

This file is the **engineering playbook** for notifications in HarmonyOS apps.
It does not replace official docs; for exact API signatures and slot/channel definitions, always verify against the official references below.

## Capability mapping

This file maps to coverage matrix row **C6. Notification**.

## Official documentation entry points

- Notification overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/notification-overview-V5
- Publish a notification guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/notification-with-basic-V5
- @ohos.notificationManager API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-notificationmanager-V5
- Reminder Agent guide (scheduled reminders): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/reminderagent-overview-V5
- @ohos.reminderAgentManager API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-reminderagentmanager-V5
- Notification slot types: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-notification-V5#NotificationSlotType
- Permission `ohos.permission.NOTIFICATION_CONTROLLER` (where applicable): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/permission-list-V5

> Notification APIs are version-sensitive; the path has shifted across SDKs (`@ohos.notification` → `@ohos.notificationManager`). Always confirm the targeted SDK.

## Concept model

HarmonyOS notifications have three concepts an agent should keep separate:

### 1. Notification slot (channel)
- categorizes notifications by importance (social, service, content, other)
- the user can disable slots independently
- choose the slot that matches the actual purpose; misuse hurts review and trust

### 2. Notification request
- the actual content (title, text, image, buttons)
- must reference a slot
- can be one-shot or replace an existing notification by ID

### 3. Reminder (scheduled)
- handled by a different subsystem: `reminderAgentManager`
- supports calendar, alarm, and timer triggers
- survives app process death; the system fires the reminder at the right time
- on fire, can show a notification and/or wake the app

### When to use which
| Need | Right tool |
|---|---|
| immediate one-shot notification | notificationManager |
| status update (download progress) | notificationManager (replace by ID) |
| reminder at a specific time | reminderAgentManager |
| daily / repeating reminder | reminderAgentManager |
| in-app prompt only | regular ArkUI dialog (no notification system) |

## Decision tree

```text
Need to alert the user?
   │
   ├── now, while app is foreground
   │     → ArkUI dialog / toast (do not pollute notification tray)
   │
   ├── now, while app is background
   │     → notificationManager.publish
   │
   ├── at a specific future time / repeating
   │     → reminderAgentManager.publishReminder
   │
   └── tied to a long-running operation (download, sync)
         → notificationManager.publish (replace by ID for progress)
```

Then for any of the above:

```text
1. Pick the right slot (importance level)
2. Use a stable notification ID for replace/update
3. Provide an explicit tap intent (where the user lands)
4. Cancel notifications when no longer relevant
5. Respect Do Not Disturb and user-disabled slots
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Request notification permission (where applicable)

```ts
import notificationManager from '@ohos.notificationManager'

export async function ensureNotificationEnabled(): Promise<boolean> {
  const enabled = await notificationManager.isNotificationEnabled()
  if (enabled) return true
  try {
    await notificationManager.requestEnableNotification()
    return await notificationManager.isNotificationEnabled()
  } catch {
    return false
  }
}
```

Some SDK versions auto-prompt on first publish; others require explicit `requestEnableNotification`. Always check `isNotificationEnabled` first.

### Pattern 2 — Publish a basic text notification

```ts
import notificationManager from '@ohos.notificationManager'

export async function publishText(opts: {
  id: number
  title: string
  text: string
  wantAgent?: any
}): Promise<void> {
  const request: notificationManager.NotificationRequest = {
    id: opts.id,
    content: {
      contentType: notificationManager.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
      normal: {
        title: opts.title,
        text: opts.text
      }
    },
    notificationSlotType: notificationManager.SlotType.SERVICE_INFORMATION
  }
  if (opts.wantAgent) {
    request.wantAgent = opts.wantAgent
  }
  await notificationManager.publish(request)
}
```

Notes:

- pass a stable `id`; calling `publish` again with the same `id` replaces the existing notification
- `SlotType` choices include `SOCIAL_COMMUNICATION`, `SERVICE_INFORMATION`, `CONTENT_INFORMATION`, `OTHER_TYPES`
- choose the slot that matches actual intent

### Pattern 3 — Publish with a tap intent (open a page)

```ts
import wantAgent from '@ohos.app.ability.wantAgent'

export async function publishWithTap(opts: {
  id: number
  title: string
  text: string
  bundleName: string
  abilityName: string
  payload?: Record<string, string>
}): Promise<void> {
  const agent = await wantAgent.getWantAgent({
    wants: [{
      bundleName: opts.bundleName,
      abilityName: opts.abilityName,
      parameters: opts.payload ?? {}
    }],
    operationType: wantAgent.OperationType.START_ABILITY,
    requestCode: 0
  })
  await publishText({ ...opts, wantAgent: agent })
}
```

The `wantAgent` is the durable handle that the system fires when the user taps the notification, even if the app is not currently running.

### Pattern 4 — Progress notification (replace by ID)

```ts
export async function publishProgress(opts: {
  id: number
  title: string
  current: number
  total: number
}): Promise<void> {
  const text = `${opts.current}/${opts.total}`
  const request: notificationManager.NotificationRequest = {
    id: opts.id,
    content: {
      contentType: notificationManager.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
      normal: {
        title: opts.title,
        text,
        additionalText: `${Math.round((opts.current / opts.total) * 100)}%`
      }
    },
    notificationSlotType: notificationManager.SlotType.SERVICE_INFORMATION
  }
  await notificationManager.publish(request)
}

export async function cancelById(id: number): Promise<void> {
  await notificationManager.cancel(id)
}
```

Always cancel progress notifications when complete; leaving stale "downloading" states damages trust.

### Pattern 5 — Schedule a daily reminder

```ts
import reminderAgentManager from '@ohos.reminderAgentManager'

export async function scheduleDailyReminder(opts: {
  hour: number
  minute: number
  title: string
  text: string
}): Promise<number> {
  const reminder: reminderAgentManager.ReminderRequestCalendar = {
    reminderType: reminderAgentManager.ReminderType.REMINDER_TYPE_CALENDAR,
    dateTime: {
      year: 0, month: 0, day: 0,
      hour: opts.hour, minute: opts.minute, second: 0
    },
    repeatMonths: [],
    repeatDays: [1, 2, 3, 4, 5, 6, 7],
    title: opts.title,
    content: opts.text,
    notificationId: Date.now() % 100000,
    slotType: notificationManager.SlotType.CONTENT_INFORMATION
  }
  return reminderAgentManager.publishReminder(reminder)
}

export async function cancelReminder(reminderId: number): Promise<void> {
  await reminderAgentManager.cancelReminder(reminderId)
}
```

Use `reminderAgentManager` whenever the trigger is time-based and must survive app process death.

### Pattern 6 — Centralized notification ID registry

```ts
export const NotificationIds = {
  ONBOARDING_HINT: 1000,
  DAILY_REMINDER: 2000,
  UPLOAD_PROGRESS: 3000,
  SYNC_STATUS: 4000
} as const

export type NotificationId = typeof NotificationIds[keyof typeof NotificationIds]
```

Centralizing IDs prevents accidental collisions between unrelated features that would otherwise overwrite each other's notifications.

## Common pitfalls

### Skipping `isNotificationEnabled` check
Calling `publish` when notifications are disabled returns success silently or throws an unclear error. Always check first; if disabled, surface a UX hint instead of failing silently.

### Wrong slot type
Using `SOCIAL_COMMUNICATION` for a non-IM service notification triggers stronger system attention and may be filtered or downgraded. Match the slot to the actual purpose.

### Random notification IDs
Using `Math.random()` or `Date.now()` for notification IDs causes duplicates and prevents update/replace flows. Use a centralized ID registry.

### Forgetting to cancel
Stale notifications (download finished hours ago, sync error long resolved) erode trust. Always cancel by ID when the underlying state changes.

### Polluting the tray when foreground
Showing a system notification while the app is in the foreground is rarely correct. Use ArkUI dialogs/toasts for in-app feedback.

### Reminder time in past timezone
Scheduling a reminder at "8:00 AM" without thinking about timezone may misfire after the user travels. Either store the user-chosen wall-clock time and recompute on schedule changes, or document the timezone assumption.

### Missing wantAgent
A notification with no `wantAgent` taps to nothing. Always wire a tap intent that lands the user on a relevant page.

### Treating notification payloads as secure
Notification text is visible on the lock screen. Never include secrets, tokens, or sensitive PII in titles or bodies.

### Not handling reminder cancellation on uninstall
Reminders persist until canceled. If the app is uninstalled cleanly, the system handles this; if the feature is removed in-app, the app must call `cancelReminder` for any prior schedule.

## Verification checklist (before shipping a notification feature)

1. notification permission state checked before publish
2. correct slot type chosen for purpose
3. notification IDs come from a centralized registry
4. tap intent (`wantAgent`) wired and tested
5. progress / status notifications canceled when complete
6. no notifications shown for foreground UX
7. reminders documented with timezone assumption
8. no secrets or PII in title/body
9. cancel paths exist for every persistent notification or reminder
10. UX fallback exists when notifications are disabled

## Fallback strategies when blocked

### When notification permission is denied
- never re-prompt aggressively
- show an in-app explanation and a button to open Settings (see permissions.md)
- continue feature without notifications, surface state inside the app instead

### When the exact `notificationManager` path differs in target SDK
- isolate notification publish behind a small adapter
- check Release Notes for module renames

### When reminders are unreliable on the test device
- verify the device's power-saving settings are not killing background tasks
- log fired reminders via HiLog for diagnosability
- fall back to in-app scheduled checks while the app is open

### When badges are required but unsupported
- some launchers do not show app badges
- treat badges as best-effort, never as the only signal

## Output expectations

When generating implementation that touches notifications, the agent should:

- check `isNotificationEnabled` before publish
- use centralized IDs, never random
- pick the right slot type with reasoning
- wire a tap intent for every actionable notification
- include a cancel path
- mention timezone for any scheduled reminder
- mention when exact API names still need official verification for the targeted SDK
