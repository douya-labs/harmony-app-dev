# project-skeleton

Minimum runnable HarmonyOS Stage Model project skeleton — a "what files do I actually need to write by hand" reference.

## Purpose

Use this file when:

- bootstrapping a new HarmonyOS project **without** DevEco Studio
  (e.g. on Linux / WSL where DevEco does not exist; cloud-side scaffolding before handing off to a Windows / macOS reviewer)
- understanding what is the **minimum** Stage Model project layout that DevEco will accept on first import
- recovering a project where build files were lost or corrupted
- writing or auditing a generator script

This file is the **engineering playbook** for the project skeleton itself.
For runtime semantics (UIAbility lifecycle, Navigation, Want, etc.) read `app-model.md`.

## Capability mapping

This file maps to coverage matrix row **A1. Application model (Stage model)** as the on-disk layout counterpart to `app-model.md`.

## Official documentation entry points

- Stage model overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/stage-model-development-overview-V5
- app.json5 configuration: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/app-configuration-file-V5
- module.json5 configuration: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/module-configuration-file-V5
- Resource categories: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/resource-categories-and-access-V5
- DevEco Studio project structure: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-tools-overview-V5

> Exact file content (especially `hvigorfile.ts` plugin imports and SDK version numbers) is version-sensitive. Always verify against an actual DevEco-generated project for the targeted SDK before assuming this skeleton compiles unchanged.

## Concept model

A HarmonyOS Stage Model app on disk has three layers:

```
<project root>            ← project-level config
├── AppScope/             ← app-wide identity (bundle, version, app icon)
├── <module-1>/           ← one HAP / HAR / HSP module
│   └── src/main/         ← code + resources for that module
│       ├── ets/          ← ArkTS source (UIAbility + pages + components)
│       ├── resources/    ← strings, colors, media, profile (routing)
│       └── module.json5  ← module descriptor (abilities, permissions)
├── <module-2>/           ← optional extra modules
└── hvigor/               ← build pipeline config
```

Three things tie this together:

1. **Bundle identity** lives in `AppScope/app.json5` (one per project)
2. **Module identity** lives in each module's `src/main/module.json5`
3. **Build wiring** lives in `build-profile.json5` + `hvigorfile.ts` at both project and module level

If any of these three are missing or inconsistent, DevEco refuses to import or hvigor refuses to build.

## Decision tree

```text
Want to bootstrap a new HarmonyOS project?
   │
   ├── DevEco Studio is available locally
   │     → use DevEco "New Project → Empty Ability" (always preferred)
   │
   └── DevEco Studio is NOT available (Linux / WSL / cloud agent)
         → write the minimum file set below by hand
         → push to git
         → ask a teammate / yourself on Windows or macOS to import in DevEco
         → fix any first-import warnings (mostly icon + plugin version)
```

```text
Importing a hand-written skeleton in DevEco fails?
   │
   ├── "App icon not found"
   │     → see "App icon placeholder" section below
   │
   ├── "@ohos/hvigor-ohos-plugin not found / version mismatch"
   │     → align hvigor plugin version with the local DevEco bundled SDK
   │
   ├── "module.json5 invalid"
   │     → verify against the official module.json5 reference
   │
   └── ohpm install failures
         → run `ohpm install` from CLI inside the project root with a working SDK env
```

## Minimum file set for one entry HAP

The smallest project that DevEco will accept and run as a launcher app needs these files. Every other file is optional or auto-generated.

### Project-level (8 files)

```
.gitignore                          # ignore .idea/, build/, oh_modules/, *.p12, .hvigor/, etc.
.editorconfig                       # optional but recommended (2-space indent, LF)
build-profile.json5                 # project signing + module list
oh-package.json5                    # project-level package metadata
hvigorfile.ts                       # project-level hvigor entry
hvigor/hvigor-config.json5          # hvigor plugin version pin
AppScope/app.json5                  # bundleName, version, app icon
AppScope/resources/base/element/string.json   # app_name string
```

### Entry module (≈9 files)

```
entry/build-profile.json5           # module build options + targets
entry/oh-package.json5              # module dependencies
entry/hvigorfile.ts                 # module hvigor entry
entry/obfuscation-rules.txt         # release obfuscation rules (placeholder)
entry/src/main/module.json5         # module + ability + permissions
entry/src/main/ets/entryability/EntryAbility.ets        # UIAbility
entry/src/main/ets/pages/Index.ets                      # first page
entry/src/main/resources/base/profile/main_pages.json   # routing list
entry/src/main/resources/base/element/string.json       # module strings
entry/src/main/resources/base/element/color.json        # start_window_background
entry/src/main/resources/base/media/app_icon.png        # see "App icon" below
```

That's it. ~17–18 hand-written files for a runnable Hello World.

## Implementation patterns

> All snippets below are reference scaffolds verified against an API 12 Stage Model project. Confirm `apiReleaseType`, plugin versions, and `modelVersion` against the targeted SDK.

### Pattern 1 — `AppScope/app.json5`

```json5
{
  "app": {
    "bundleName": "com.example.myapp",
    "vendor": "example",
    "versionCode": 1000000,
    "versionName": "0.1.0",
    "icon": "$media:app_icon",
    "label": "$string:app_name",
    "minAPIVersion": 12,
    "targetAPIVersion": 12,
    "apiReleaseType": "Release"
  }
}
```

Notes:

- `versionCode` is a monotonic integer; reviewers reject rollbacks
- `apiReleaseType` is `Release` for store-bound builds; `Beta` allows beta SDK APIs
- `minAPIVersion` should match the lowest API level the codebase actually uses

### Pattern 2 — `AppScope/resources/base/element/string.json`

```json
{
  "string": [
    { "name": "app_name", "value": "MyApp" }
  ]
}
```

This file is **required** because `app.json5` references `$string:app_name`. Missing the string is a common first-import failure.

### Pattern 3 — Project-level `build-profile.json5`

```json5
{
  "modelVersion": "5.0.0",
  "modules": [
    { "name": "entry", "srcPath": "./entry" }
  ]
}
```

In a real DevEco-generated project this also contains `signingConfigs` blocks for debug + release signing material. Hand-written skeletons can omit `signingConfigs` and let DevEco populate them on first import (DevEco will generate a debug certificate automatically).

### Pattern 4 — Project-level `hvigorfile.ts` + `oh-package.json5`

```ts
// hvigorfile.ts
import { appTasks } from '@ohos/hvigor-ohos-plugin';

export default {
  system: appTasks,
  plugins: []
};
```

```json5
// oh-package.json5
{
  "name": "myapp",
  "version": "0.1.0",
  "description": "",
  "main": "",
  "author": "",
  "license": "MIT",
  "dependencies": {}
}
```

### Pattern 5 — `hvigor/hvigor-config.json5`

```json5
{
  "hvigorVersion": "5.0.0",
  "dependencies": {
    "@ohos/hvigor-ohos-plugin": "5.0.0"
  }
}
```

This file pins the hvigor toolchain version. Misalignment between this version and the DevEco-bundled SDK is the most common "import succeeded but build fails" cause.

### Pattern 6 — Entry module `build-profile.json5`

```json5
{
  "apiType": "stageMode",
  "buildOption": {
    "arkOptions": {
      "runtimeOnly": { "sources": [], "packages": [] }
    }
  },
  "buildOptionSet": [
    {
      "name": "release",
      "arkOptions": {
        "obfuscation": {
          "ruleOptions": {
            "enable": true,
            "files": ["./obfuscation-rules.txt"]
          }
        }
      }
    }
  ],
  "targets": [
    { "name": "default" },
    { "name": "ohosTest" }
  ]
}
```

### Pattern 7 — Entry `module.json5`

```json5
{
  "module": {
    "name": "entry",
    "type": "entry",
    "description": "$string:module_desc",
    "mainElement": "EntryAbility",
    "deviceTypes": ["phone", "tablet"],
    "deliveryWithInstall": true,
    "installationFree": false,
    "pages": "$profile:main_pages",
    "abilities": [
      {
        "name": "EntryAbility",
        "srcEntry": "./ets/entryability/EntryAbility.ets",
        "description": "$string:EntryAbility_desc",
        "icon": "$media:app_icon",
        "label": "$string:EntryAbility_label",
        "startWindowIcon": "$media:app_icon",
        "startWindowBackground": "$color:start_window_background",
        "exported": true,
        "skills": [
          {
            "entities": ["entity.system.home"],
            "actions": ["action.system.home"]
          }
        ]
      }
    ],
    "requestPermissions": [
      { "name": "ohos.permission.INTERNET" }
    ]
  }
}
```

The `entity.system.home` + `action.system.home` skill is what makes the ability appear as a launcher entry. Omit it for headless / share-target abilities.

### Pattern 8 — Routing config `main_pages.json`

```json
{
  "src": [
    "pages/Index"
  ]
}
```

Every page that can be loaded by `windowStage.loadContent` or pushed via Router must appear here. Navigation-driven destinations do not need to be listed (they live in component code) but the **landing page** still must.

### Pattern 9 — Minimal `EntryAbility.ets`

```ts
import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';
import hilog from '@ohos.hilog';
import type Want from '@ohos.app.ability.Want';
import type AbilityConstant from '@ohos.app.ability.AbilityConstant';

const TAG = 'EntryAbility';
const DOMAIN = 0x0001;

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(DOMAIN, TAG, 'onCreate');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(DOMAIN, TAG, `loadContent failed: ${err.message}`);
      }
    });
  }
}
```

See `app-model.md` for the full lifecycle hooks.

### Pattern 10 — Minimal `Index.ets`

```ts
@Entry
@Component
struct Index {
  @State greeting: string = 'Hello HarmonyOS';

  build() {
    Column() {
      Text(this.greeting).fontSize(28)
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center);
  }
}
```

## App icon placeholder

Almost every hand-written skeleton fails on first DevEco import with "app icon not found", because both `app.json5` and `module.json5` reference `$media:app_icon` and the actual PNG cannot be hand-typed.

There are three valid responses:

### Option 1 — Generate via DevEco (recommended)

In DevEco: right-click `entry/src/main/resources/base/media/` → **New → Image Asset** → keep defaults → Finish. DevEco generates a layered icon set (foreground + background + multiple densities).

### Option 2 — Drop in any 1024×1024 PNG manually

Copy any square PNG to:

```
entry/src/main/resources/base/media/app_icon.png
```

DevEco accepts it without complaint; layered icon assets can be added later.

### Option 3 — Leave a README pointer

If the agent cannot create binary assets, leave a `media/README.md` describing options 1 and 2 so the human reviewer knows the expected next step. Do **not** invent a fake `media.json` index entry that points back to itself — that file is not how the resource is registered, and a self-referencing entry produces confusing build errors.

## .gitignore essentials

```
# DevEco Studio + HarmonyOS build artifacts
.idea/
.cxx/
.hvigor/
.deveco/
build/
oh_modules/
*.iml
local.properties

# Signing material — never commit
*.p12
*.cer
*.p7b
material/

# OS noise
.DS_Store
Thumbs.db
```

`.p12`, `.cer`, `.p7b`, and `material/` matter most. Committing signing material is a real-world incident.

## Common pitfalls

### Missing `AppScope/resources/base/element/string.json`
`app.json5` references `$string:app_name`. Without the file, DevEco import fails immediately.

### Self-referencing `media.json`
The `resources/base/media/` folder does **not** need an index file — PNGs/SVGs in it are auto-registered by filename. Hand-writing a `media.json` that maps `"app_icon": "$media:app_icon"` creates a circular reference and confusing errors.

### Missing routing entry in `main_pages.json`
Pages loaded by `windowStage.loadContent('pages/Index', …)` must appear in `main_pages.json`. Otherwise the load fails silently or with a generic resource error.

### `hvigor` plugin version mismatch
If `hvigor/hvigor-config.json5` pins `@ohos/hvigor-ohos-plugin` to a version that does not match the DevEco-bundled SDK, the project imports but builds fail with cryptic plugin errors. Match the exact version DevEco generates for a fresh project on the same SDK.

### Forgetting `entity.system.home` skill
Without the launcher skill, the app installs but no icon appears in the home screen — a confusing "did install succeed?" symptom.

### Mixing legacy FA model artifacts
Stage model projects must not contain `config.json` (FA model). Some old templates leave both. Delete `config.json` if the project is Stage model.

### Hand-written `.idea/` or `.hvigor/`
DevEco regenerates these on import. Hand-written versions get overwritten or cause IDE confusion. Always gitignore them.

### Wrong `srcPath` casing in `build-profile.json5`
On macOS / Windows the casing typo (e.g. `./Entry` vs `./entry`) may pass; on Linux + case-sensitive filesystems it breaks. Stay lowercase consistently.

## Verification checklist (before first DevEco import)

1. exactly one `AppScope/app.json5` at project root
2. `AppScope/resources/base/element/string.json` includes `app_name`
3. each module has `build-profile.json5`, `oh-package.json5`, `hvigorfile.ts`
4. each module has `src/main/module.json5` with a valid `mainElement` ability
5. landing page is listed in `resources/base/profile/main_pages.json`
6. `app.json5` and `module.json5` agree on `$media:app_icon` reference
7. either `app_icon.png` exists or a README explains how to add it
8. `hvigor/hvigor-config.json5` plugin version aligns with target SDK
9. `.gitignore` excludes `.idea/`, `.hvigor/`, `build/`, `oh_modules/`, signing artifacts
10. no leftover `config.json` from FA model

## Fallback strategies when blocked

### When DevEco import fails on first try
- compare the failing file against the official sample `EmptyAbility` template for the same SDK
- temporarily remove `obfuscation` block; release builds can be re-enabled later
- if multiple errors, fix one file at a time, re-import after each

### When working on Linux / WSL with no DevEco available
- write the skeleton on Linux per this file
- push to git
- have a Windows / macOS teammate `git clone` and `File → Open` in DevEco
- iterate via PR review or screen-share for first-import feedback

### When the SDK version is unknown
- pin to the latest LTS-style major version (e.g. API 12 at time of writing)
- avoid Beta / preview SDKs unless explicitly required by a feature

### When migrating from FA model
- start a new Stage model project from the official template
- port code page-by-page rather than trying to convert in place
- delete `config.json` once Stage model `module.json5` is verified working

## Output expectations

When generating a project skeleton or auditing one, the agent should:

- list all 17–18 minimum files explicitly so reviewers can spot missing ones
- include the routing entry, color, and string resources that other files reference
- provide an explicit app-icon strategy (don't leave a dangling `$media:app_icon`)
- pin hvigor plugin version to a value verified against a real DevEco project
- mention which SDK API level the skeleton targets
- recommend DevEco's "New Project → Empty Ability" as the canonical generator when DevEco is available
