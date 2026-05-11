# capability-map

## Purpose

Use this file to classify a HarmonyOS requirement before coding. The goal is not to memorize APIs, but to answer:

> Which Harmony capability domain does this request belong to, and which official documentation path should be checked next?

## Capability mapping rule

This map mirrors the official HarmonyOS Guides first-level domains and the skill's own `coverage.md`. When a new domain is added in `coverage.md`, update this file too.

## Official documentation roots

- Docs home: https://developer.huawei.com/consumer/cn/doc/
- Guides: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5
- References (API): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V6
- Release Notes: https://developer.huawei.com/consumer/cn/doc/harmonyos-releases-V6

---

## Domain index (mirrors official Guides + coverage.md)

### A. Application foundation

#### A1. Application model (Stage model)
- triggers: app structure, lifecycle, UIAbility, app startup
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/stage-model-development-overview-V5
- local: `app-model.md`

#### A2. HAP / HAR / HSP packaging
- triggers: multi-module split, shared library, dynamic feature
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/hap-package-V5
- local: missing (P2)

#### A3. Resource management
- triggers: i18n strings, theme resources, qualifier resources
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/resource-categories-and-access-V5
- local: missing (P2)

#### A4. ArkTS language
- triggers: language semantics, type system, decorators
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-overview-V5
- local: missing (P2)

---

### B. UI development

#### B1. ArkUI declarative UI
- triggers: page layout, components, custom components
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/arkui-declarative-comp-V5
- local: `ui-implementation-rules.md`, `example-cookbook.md`, `component-library-policy.md`

#### B2. ArkUI state management
- triggers: `@State`, `@Prop`, `@Link`, `@Provide`, `AppStorage`, `PersistentStorage`
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-state-V5
- local: missing (P0)

#### B3. Visual effects
- triggers: blur, shadow, glow, glassmorphism, gradient
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-universal-attributes-image-effect-V5
- local: `visual-effects-recipes.md`

#### B4. Animation and transitions
- triggers: spring motion, page transition, shared element
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-animation-overview-V5
- local: partial (`ui-implementation-rules.md`, `visual-effects-recipes.md`); split-out file missing (P1)

#### B5. Gesture interaction
- triggers: tap, drag, pinch, rotate, swipe
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-gesture-events-V5
- local: partial; split-out file missing (P1)

#### B6. Canvas / 2D drawing
- triggers: procedural drawing, wave, custom chart
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-components-canvas-canvas-V5
- local: partial in `visual-effects-recipes.md` (P1 to split out)

#### B7. ArkGraphics 3D
- triggers: real 3D scene, Component3D, Scene/Camera/Light
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkgraphics3d-overview-V5
- local: `graphics-3d.md`

#### B8. UI design / HarmonyOS Design
- triggers: spec compliance, theme, design tokens
- official: https://developer.huawei.com/consumer/cn/doc/design-guides/
- local: missing (P2)

---

### C. System capabilities (engineering essentials)

#### C1. Permissions
- triggers: any sensitive resource access, `module.json5` permissions
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/accesstoken-overview-V5
- local: missing (**P0**)

#### C2. Network
- triggers: HTTP, file upload/download, network status
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-http-V5
- local: missing (**P0**)

#### C3. Persistence (ArkData)
- triggers: Preferences (KV-like), RDB (SQLite), Distributed KV
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/data-mgmt-overview-V5
- local: missing (**P0**)

#### C4. File management
- triggers: app sandbox files, public directories, file picker
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/app-file-access-V5
- local: missing (P1)

#### C5. Camera and media
- triggers: camera, photo capture, image, audio, media library
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/camera-overview-V5
- local: missing (**P0**)

#### C6. Notification
- triggers: instant notification, scheduled reminders, channels
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/notification-overview-V5
- local: missing (**P0**)

#### C7. Background tasks
- triggers: long task, scheduled task, transient task
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/background-task-overview-V5
- local: missing (P1)

#### C8. Location
- triggers: GPS, geocoding, geofence
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/location-overview-V5
- local: missing (P1)

#### C9. Security and privacy
- triggers: encryption, Keystore, hashing, secure storage
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/huks-overview-V5
- local: missing (P1)

#### C10. Distributed capability
- triggers: cross-device sync, hand-off, distributed data
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/inter-device-interaction-overview-V5
- local: missing (P1)

#### C11. Concurrency
- triggers: TaskPool, Worker, async heavy work
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/taskpool-introduction-V5
- local: missing (P1)

#### C12. Multimodal awareness
- triggers: motion sensing, gesture awareness sensors
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-multimodalawarenesskit-motion-V5
- local: partial (`official-api-examples.md`)

---

### D. Surface form factors

#### D1. Widget / service card
- triggers: home screen card, FormExtensionAbility
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/service-widget-overview-V5
- local: `widget.md`

#### D2. Atomic service (元服务)
- triggers: serviceless distribution, scan to use
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/atomicservice-overview-V5
- local: missing (P2)

#### D3. Cross-device (phone / tablet / watch / TV / car)
- triggers: form-factor adaptation, watch app, tablet layout
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/cross-device-application-overview-V5
- local: missing (P2)

---

### E. Quality and delivery

#### E1. Debugging
- triggers: HiLog, Profiler, DevEco Studio diagnostic tools
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/hilog-guidelines-V5
- local: missing (P1)

#### E2. Testing
- triggers: unit test, instrumentation test, UI test
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/test-framework-overview-V5
- local: missing (P1)

#### E3. Publishing
- triggers: signing, version, AppGallery Connect, review
- official: https://developer.huawei.com/consumer/cn/agconnect/
- local: missing (P1)

#### E4. Internationalization
- triggers: i18n, l10n, RTL
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/i18n-introduction-V5
- local: missing (P2)

#### E5. Accessibility
- triggers: TalkBack-equivalent, large text, semantic labels
- official: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/accessibility-overview-V5
- local: missing (P2)

---

## Practical mapping examples

### "Build a frosted glass gallery page"
- B1 ArkUI declarative UI
- B3 Visual effects

### "Implement a 3D flip card"
- B4 Animation
- B5 Gesture
- B7 ArkGraphics 3D **only if** 2.5D transforms are insufficient

### "Build a wave progress demo page"
- B6 Canvas
- B4 Animation

### "Take a photo, upload it, and recognize the content"
- C1 Permissions (camera)
- C5 Camera and media
- C2 Network (upload)
- C3 Persistence (record result)

### "Send a daily reminder at 9am"
- C6 Notification
- C7 Background tasks (scheduled trigger)
- C1 Permissions (notification permission)

### "Show app status on the home screen"
- D1 Widget
- C3 Persistence (read shared data)

---

## Usage rule

When a Harmony task starts:

1. classify it here first
2. then read the narrowest matching reference file
3. if no local file exists, follow the official URL provided here
4. then use official docs only for exact API verification
