---
title: "Publishing"
description: "Use this file when preparing a HarmonyOS app for AppGallery release. Covers signing, version, packaging, store listing, sensitive permission review, and post-release operation hygiene."
sidebar:
  order: 3
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/publishing.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/publishing.md)

## Purpose

Use this file when preparing a HarmonyOS app for AppGallery release.
Covers signing, version, packaging, store listing, sensitive permission review, and post-release operation hygiene.

This file is the **engineering playbook** for shipping to AppGallery.
It does not replace official docs; review policy and certificate procedures change frequently — always verify against the references below before submission.

## Capability mapping

This file maps to coverage matrix row **E3. Publishing (AppGallery Connect)**.

## Official documentation entry points

- AppGallery Connect home: https://developer.huawei.com/consumer/cn/agconnect/
- App distribution overview: https://developer.huawei.com/consumer/cn/agconnect/distribution-service/
- DevEco Studio configuration overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-overview-V5
- Application signing guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/signing-V5
- App configuration (`app.json5`): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/app-configuration-file-V5
- Module configuration (`module.json5`): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/module-configuration-file-V5
- Release publication guide (AppGallery Connect): https://developer.huawei.com/consumer/cn/doc/distribution/app/agc-help-releaseapp-0000001146808521
- HarmonyOS app review checklist (privacy / permissions): https://developer.huawei.com/consumer/cn/doc/distribution/app/agc-help-publishstandard-0000001146808511

> Specific URL paths under AppGallery Connect change occasionally. Always navigate from the AppGallery Connect home if a deep link 404s.

## Concept model

### Three identities a release combines
- **app identity** (bundleName, certificate fingerprint) — uniquely identifies the app to the system
- **store identity** (AppGallery app id, listing) — uniquely identifies the app in the store
- **release identity** (version code, version name, signing profile) — uniquely identifies a build

A mismatch between these (wrong cert, reused version code, mismatched bundle) is the most common reason a release is rejected or fails to install upgrade.

### Two signing modes
- **debug** — locally signed by DevEco Studio for development; not acceptable for release
- **release** — signed with a release profile from AppGallery Connect; required for store submission

### Versioning
- `versionCode` (integer, monotonically increasing) — used by the system for upgrade comparison; **must increase** every release
- `versionName` (string) — visible to users; semantic versioning recommended (e.g., `1.2.0`)

### Permission review weight
- **normal** permissions — minor review
- **sensitive** permissions (camera, location, contacts, etc.) — require justified `reason` strings, real usage, and may need additional documentation
- **system_basic / system_core** permissions — typically not granted to third-party apps

## Decision tree

```text
Preparing a release?
   │
   ├── first ever release?
   │     → create app in AppGallery Connect
   │     → generate release signing profile (.p7b + .cer)
   │     → configure DevEco Studio with release signing
   │
   ├── upgrade release?
   │     → bump versionCode (and versionName if user-visible)
   │     → keep bundleName and signing identity unchanged
   │
   ├── adding a sensitive permission?
   │     → justify reason in module.json5 (localized string)
   │     → update privacy policy
   │     → prepare review notes describing exact use
   │
   └── adding a new module / extension ability?
         → declare in module.json5
         → if Widget: confirm form_config.json
         → if Service Extension: confirm background behavior is justified
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact field names against the targeted SDK / AppGallery rules before submitting.

### Pattern 1 — `app.json5` minimal release shape

```json5
{
  "app": {
    "bundleName": "com.example.coffeepet",
    "vendor": "example",
    "versionCode": 4,
    "versionName": "1.0.3",
    "icon": "$media:app_icon",
    "label": "$string:app_name",
    "minAPIVersion": 11,
    "targetAPIVersion": 12
  }
}
```

Notes:

- `versionCode` must strictly increase across releases
- `minAPIVersion` defines the lowest device the app can install on
- `targetAPIVersion` defines what API surface the app expects; affects compat shims

### Pattern 2 — Sensitive permission with localized reason

```json5
{
  "module": {
    "requestPermissions": [
      {
        "name": "ohos.permission.CAMERA",
        "reason": "$string:reason_camera",
        "usedScene": { "abilities": ["EntryAbility"], "when": "inuse" }
      }
    ]
  }
}
```

`reason` must point to a localized string resource. Hardcoded literals get flagged in review.

### Pattern 3 — Build configuration profile

DevEco Studio uses a `build-profile.json5` (or equivalent) per project to wire signing and target SDK. The release profile must reference the certificate downloaded from AppGallery Connect:

```json5
{
  "app": {
    "signingConfigs": [
      {
        "name": "release",
        "type": "HarmonyOS",
        "material": {
          "certpath": "./signing/release.cer",
          "storePassword": "<encrypted>",
          "keyAlias": "release-key",
          "keyPassword": "<encrypted>",
          "profile": "./signing/release.p7b",
          "signAlg": "SHA256withECDSA",
          "storeFile": "./signing/release.p12"
        }
      }
    ]
  }
}
```

Notes:

- never commit certificate or password material to git; reference via env vars or local-only files
- regenerate the profile from AppGallery Connect when the bundle name or signing certificate changes

### Pattern 4 — Release checklist (manual)

Run before each release submission:

```text
[ ] versionCode bumped strictly above last release
[ ] versionName updated
[ ] release signing profile in use (not debug)
[ ] bundleName matches AppGallery store entry
[ ] all sensitive permissions have localized reason strings
[ ] privacy policy updated to mention any new data collected
[ ] release notes drafted in zh-CN (and target locales)
[ ] icon and screenshot assets refreshed
[ ] tested on at least two device classes (e.g., phone + tablet) when supported
[ ] no debug logs leaking PII
[ ] crash-reporting / analytics opt-out path works
[ ] all in-app links and external URLs open correctly
[ ] dark mode verified on key screens
```

### Pattern 5 — Privacy policy alignment

A privacy policy must accompany the listing and must:

- enumerate every category of personal data collected
- explain why each is collected (purpose limitation)
- name third parties data is shared with (analytics SDKs, AI APIs)
- describe storage location and retention
- offer a contact for user inquiries
- offer a path for account deletion / data export where applicable

Misalignment between policy and actual permissions is a common rejection reason.

### Pattern 6 — Store listing assets

Plan before the listing form:

- app name (≤ 25 chars typically)
- short description (≤ 80 chars)
- long description (structure: what / who / how / why)
- screenshots (multiple device sizes if supported)
- icon (square, follow design spec)
- promotional artwork (if banner placement available)
- support URL (must be reachable)
- developer / publisher info (must be accurate; mismatched info is a rejection reason)

## Common pitfalls

### Reusing a versionCode
The system rejects upgrade installs when versionCode does not increase. CI should fail if a release reuses the previous versionCode.

### Wrong signing certificate
A release signed with the wrong certificate cannot upgrade an existing install (different identity). Users must uninstall first, which triggers reviews and complaints.

### Hardcoded permission reasons
`"reason": "Camera permission"` literal will be flagged. Always reference a localized string resource.

### Mismatched bundleName
Changing bundleName mid-life cycle effectively creates a new app. Choose carefully at the start; never change once published.

### Sensitive permission without real usage
Declaring a permission "just in case" without code paths that use it will be flagged in review. Remove unused permissions before release.

### Missing privacy policy update
Adding a new SDK (analytics, ad, AI) without updating the privacy policy is a frequent rejection reason. Update both code and policy together.

### Debug logs in release builds
HiLog left at verbose level may expose PII or internal state. Default to `INFO` or higher in release builds; gate verbose logs behind debug flags.

### Cleartext HTTP for API calls
HarmonyOS may reject or warn on cleartext HTTP for sensitive endpoints. Default to HTTPS everywhere.

### Forgetting locale-specific assets
A zh-CN listing with English screenshots looks unprofessional and may be flagged. Provide locale-appropriate assets.

### Treating beta release like final
Beta channels still appear under the developer's identity. Treat beta releases with the same QA rigor as production.

## Verification checklist (before submitting to AppGallery)

1. versionCode strictly above previous release
2. release signing profile used and verified
3. bundleName matches AppGallery entry
4. all permissions justified, all `reason` strings localized
5. unused permissions removed
6. privacy policy current and aligned with code
7. listing assets prepared in the right locales and sizes
8. release notes written and proofread
9. crash-reporting and analytics initialized correctly
10. release tested on device, not just simulator

## Fallback strategies when blocked

### When release signing setup is blocked
- continue dev with debug signing
- complete signing setup before any production-bound milestone
- never use debug builds for any kind of "soft launch"

### When a sensitive permission is rejected
- redesign the feature around a less sensitive permission if possible
- prepare a stronger justification (use case, frequency, user benefit)
- consider gating the feature behind explicit user opt-in

### When a release is rejected
- read the reviewer note literally; do not over-interpret
- fix the cited issue minimally; submit again rather than rewriting unrelated parts
- if unclear, contact AppGallery support before guessing

### When upgrade installs fail in the field
- confirm versionCode increased
- confirm signing identity unchanged
- confirm bundleName unchanged

## Output expectations

When generating release-prep work, the agent should:

- update versionCode and versionName explicitly
- never use debug signing for release builds
- list every sensitive permission and its localized reason
- mention privacy policy alignment as a checklist item
- produce a release-notes draft, not just code changes
- mention when current AppGallery rules need verification before final submission
