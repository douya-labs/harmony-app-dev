---
title: "Permissions"
description: "Use this file when a HarmonyOS task involves any of:"
sidebar:
  order: 1
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/permissions.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/permissions.md)

## Purpose

Use this file when a HarmonyOS task involves any of:

- requesting sensitive resources (camera, location, notification, contacts, storage, microphone)
- declaring permissions in `module.json5`
- handling user grant / deny / never-ask-again outcomes
- designing a permission UX flow (when to ask, what to do when denied)
- preparing for AppGallery review of sensitive permissions

This file is the **engineering playbook** for permissions in HarmonyOS apps.
It does not replace official docs; for exact permission constants and the latest signing rules, always verify against the official references below.

## Capability mapping

This file maps to coverage matrix row **C1. Permissions**.

## Official documentation entry points

- Permissions overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/accesstoken-overview-V5
- Application permission grant rules: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/determine-application-mode-V5
- Permission list (system + app permissions): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/permission-list-V5
- Request user authorization: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/request-user-authorization-V5
- abilityAccessCtrl API reference: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-abilityaccessctrl-V5
- module.json5 configuration: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/module-configuration-file-V5

> Always treat the official permission list as the source of truth for exact permission constant names. Constants like `ohos.permission.CAMERA` may evolve across SDK versions.

## Concept model

HarmonyOS permissions have three orthogonal dimensions an agent must understand before writing any code:

### 1. Authorization mode (who decides)

- **system_grant** — granted automatically based on declaration; no runtime prompt
- **user_grant** — must be requested at runtime via API; user can deny or revoke
- **system_grant + user_grant combined** — some sensitive permissions require both

### 2. Permission level (who can hold it)

- **normal** — any app can apply
- **system_basic** — only system apps or apps with stronger signing
- **system_core** — restricted to system core apps

If a needed permission is `system_basic` or higher and the app does not have matching signing, the request will fail no matter how the UX is designed. Catch this at the planning stage, not runtime.

### 3. ACL (Access Control List)

Some permissions require an additional ACL declaration in the signing profile, not just `module.json5`. The runtime grant flow will silently fail without ACL when required.

## Decision tree

When asked to add a permission:

```text
1. Identify the exact official permission constant from permission-list
   ├── if it does not exist in the official list → re-classify the requirement
   └── continue
2. Check the authorization mode
   ├── system_grant only → declare in module.json5, done
   └── user_grant → continue to step 3
3. Check the permission level
   ├── normal → any app can apply, continue to step 4
   ├── system_basic → confirm signing profile compatibility before promising the feature
   └── system_core → stop and warn the user; this is unlikely to be granted
4. Check ACL requirement
   ├── ACL required → record this in the signing/profile checklist
   └── not required → continue
5. Design the UX
   ├── add a pre-prompt rationale screen for sensitive permissions
   ├── request via abilityAccessCtrl.requestPermissionsFromUser
   ├── handle granted / denied / banned outcomes
   └── for "banned", guide the user to system Settings instead of re-prompting
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Declare in `module.json5`

```json5
{
  "module": {
    "name": "entry",
    "type": "entry",
    "requestPermissions": [
      {
        "name": "ohos.permission.CAMERA",
        "reason": "$string:reason_camera",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      },
      {
        "name": "ohos.permission.INTERNET"
      }
    ]
  }
}
```

Notes:

- `reason` must point to a localized string resource, not a hardcoded literal. AppGallery review checks this.
- `usedScene.when` is one of `inuse` or `always`. Prefer `inuse` whenever possible — `always` triggers stricter review.
- Permissions that are `system_grant` only need declaration; do not call the runtime API for them.

### Pattern 2 — Request a single permission at runtime

```ts
import abilityAccessCtrl from '@ohos.abilityAccessCtrl'
import common from '@ohos.app.ability.common'
import { BusinessError } from '@ohos.base'

export type GrantResult = 'granted' | 'denied' | 'banned'

export async function requestCameraPermission(
  context: common.UIAbilityContext
): Promise<GrantResult> {
  const atManager = abilityAccessCtrl.createAtManager()
  try {
    const result = await atManager.requestPermissionsFromUser(context, [
      'ohos.permission.CAMERA'
    ])
    const status = result.authResults[0]
    if (status === 0) return 'granted'
    // status === -1 typically means the user has chosen "never ask again"
    if (status === -1) return 'banned'
    return 'denied'
  } catch (err) {
    const e = err as BusinessError
    console.error(`[perm] request CAMERA failed: ${e.code} ${e.message}`)
    return 'denied'
  }
}
```

### Pattern 3 — Pre-check before requesting

```ts
import abilityAccessCtrl from '@ohos.abilityAccessCtrl'
import bundleManager from '@ohos.bundle.bundleManager'

export async function isPermissionGranted(perm: string): Promise<boolean> {
  const atManager = abilityAccessCtrl.createAtManager()
  const bundleInfo = await bundleManager.getBundleInfoForSelf(
    bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION
  )
  const tokenId = bundleInfo.appInfo.accessTokenId
  const status = await atManager.checkAccessToken(tokenId, perm)
  return status === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED
}
```

Use `isPermissionGranted` first to avoid prompting users who have already granted access.

### Pattern 4 — Open system Settings as a fallback for banned permissions

```ts
import common from '@ohos.app.ability.common'
import Want from '@ohos.app.ability.Want'

export async function openAppPermissionSettings(
  context: common.UIAbilityContext,
  bundleName: string
): Promise<void> {
  const want: Want = {
    bundleName: 'com.huawei.hmos.settings',
    abilityName: 'com.huawei.hmos.settings.MainAbility',
    uri: 'application_info_entry',
    parameters: {
      pushParams: bundleName
    }
  }
  await context.startAbility(want)
}
```

The exact Settings deep link depends on the system version. Verify against the official Settings ability docs for the targeted release.

### Pattern 5 — UX flow for sensitive permissions

```text
Tap feature button
   │
   ▼
isPermissionGranted?
   ├── yes → run feature
   └── no  → show pre-prompt rationale screen
              │
              ▼
         user agrees → requestCameraPermission
              │
   ┌──────────┼──────────────┐
   ▼          ▼              ▼
granted   denied         banned
   │          │              │
 run        soft remind   show "open settings" button
            (no loop)     → openAppPermissionSettings
```

Key UX rules:

- never request multiple sensitive permissions on app launch
- never re-prompt after `denied` in a tight loop
- never re-prompt after `banned`; redirect to Settings
- always provide a non-permission fallback (e.g., manual input) when possible

## Common pitfalls

### Permission constant typos
HarmonyOS permission constants are strings (e.g., `ohos.permission.CAMERA`). A typo silently fails the request rather than throwing. Mitigation: extract permission constants into a single typed `Permissions` object and reference everywhere.

### Forgetting `module.json5` declaration
Calling `requestPermissionsFromUser` without declaring the permission in `module.json5` returns `denied` with no system prompt. Always declare first, then request.

### Confusing `denied` and `banned`
- `denied` — user picked "deny" once; can be re-asked next session, but spamming hurts UX
- `banned` — user picked "deny + never ask again" (or system disabled it); API will not show prompt; must guide to Settings

### Requesting at app launch
Asking for camera/location at app start before the user understands the value drops grant rates significantly. Always ask in-context, on the first feature use.

### Ignoring `usedScene` review impact
`usedScene.when: "always"` (background usage) makes AppGallery review stricter. Use `inuse` unless background access is actually required.

### `system_basic` / `system_core` in normal apps
Permissions at these levels need privileged signing. A normal third-party app cannot get them through declaration alone. Catch this in design, not runtime.

### ACL silently breaking grants
Some sensitive permissions require an ACL entry in the signing profile (`acls` field). Without it, the system silently denies the grant. Always check the official permission list for ACL requirements.

### Permission revoked between calls
Users can revoke permissions in Settings while the app is running. Always re-check via `isPermissionGranted` before starting a permission-gated operation, even if granted earlier in the session.

## Verification checklist (before shipping a permission)

1. permission constant exists in the official permission list
2. authorization mode confirmed (system_grant vs user_grant)
3. permission level compatible with current signing profile
4. ACL declared if required
5. `module.json5` includes the permission with localized `reason`
6. runtime request happens in-context, not at app launch
7. `granted` / `denied` / `banned` paths all handled
8. non-permission fallback exists for the feature
9. AppGallery review notes prepared for sensitive permissions
10. revocation handled by re-checking before each gated operation

## Fallback strategies when blocked

### When the exact API constant is uncertain
- search official permission list with the keyword (e.g., `CAMERA`, `LOCATION`)
- if not found in the current SDK version, search Release Notes for renames
- as a last resort, treat the permission as not yet supported and ship the feature with a manual fallback

### When signing prevents a needed permission
- redesign the feature to use a `normal` permission alternative if one exists
- otherwise, mark the feature as "requires privileged signing" and defer

### When the user denies repeatedly
- do not loop prompts
- offer a feature-degraded path
- expose an explicit "Enable in Settings" entry in the feature area, not as a popup

## Output expectations

When generating implementation that touches permissions, the agent should:

- name each permission used and link to the official permission list
- distinguish `system_grant` vs `user_grant` permissions in the explanation
- provide both declaration (`module.json5`) and runtime request code
- handle `granted` / `denied` / `banned` outcomes
- mention any ACL or signing dependency
- note when the exact API name still requires official verification
