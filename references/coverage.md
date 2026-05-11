# coverage

## Purpose

This file is the official coverage map for `harmony-app-dev`.
It records:

- the canonical first-level structure of the official HarmonyOS docs (Guides + References)
- which official categories this skill currently covers
- which categories are missing
- recommended priority for filling the gaps

This file is the source of truth for skill completeness.
All gap planning, audit work, and roadmap discussion should refer to this file.

## How to use this file

When asked "is this skill complete?" or "do we have X capability covered?":

1. find the matching official category below
2. check the `Local file` column
3. if missing, follow the `Priority` column to plan the gap fill

When adding a new reference file:

1. confirm which official category it serves
2. add or update the row in this table
3. include at least one official URL in the new reference file

## Official documentation roots

| Section | URL |
|---|---|
| Docs home | https://developer.huawei.com/consumer/cn/doc/ |
| Design | https://developer.huawei.com/consumer/cn/doc/design-guides/ |
| Guides | https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5 |
| References (API) | https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V6 |
| Release Notes | https://developer.huawei.com/consumer/cn/doc/harmonyos-releases-V6 |
| AppGallery Connect | https://developer.huawei.com/consumer/cn/agconnect/ |

> Version note: HarmonyOS docs are versioned. Guides are commonly seen under V5, References under V6, and newer iterations may exist (V14 etc.). Always verify the current valid version when implementing version-sensitive features.

## Coverage matrix — Guides (first-level domains)

Status legend:

- ✅ covered — has a dedicated reference file with at least one official URL
- 🟡 partial — mentioned but lacks depth or official URL anchoring
- ❌ missing — no dedicated reference file
- 🟦 intentionally out of scope — currently not in skill scope (will be revisited)

| # | Official domain (Guides) | Local file | Status | Priority |
|---|---|---|---|---|
| 1 | 应用模型 (Application Model / Stage 模型) | `app-model.md` | 🟡 partial | P1 (upgrade) |
| 2 | 应用程序包 (HAP / HAR / HSP) | — | ❌ missing | P2 |
| 3 | UI 开发 (ArkUI 声明式 UI) | `ui-implementation-rules.md`, `visual-effects-recipes.md`, `example-cookbook.md`, `component-library-policy.md` | ✅ covered | maintain |
| 4 | UI 设计 (Design / HarmonyOS Design) | — | ❌ missing | P2 |
| 5 | 资源管理 (Resource Manager) | — | ❌ missing | P2 |
| 6 | 权限管理 (Ability Kit / Permissions) | `permissions.md` | ✅ covered | maintain |
| 7 | 网络 (Network Kit / @ohos.net.http) | `network.md` | ✅ covered | maintain |
| 8 | 数据管理 (ArkData: Preferences / RDB / KV) | `persistence.md` | ✅ covered | maintain |
| 9 | 文件管理 (Core File Kit) | — | ❌ missing | P1 |
| 10 | 媒体 (Camera Kit / Image Kit / Audio / Media Library) | `media-and-camera.md` | ✅ covered | maintain |
| 11 | 通知 (Notification Kit) | `notification.md` | ✅ covered | maintain |
| 12 | 后台任务 (Background Tasks Kit) | — | ❌ missing | P1 |
| 13 | 位置 (Location Kit) | — | ❌ missing | P1 |
| 14 | 安全 (Universal Keystore / 加密 / 隐私) | — | ❌ missing | P1 |
| 15 | 分布式 (Distributed Service Kit / 流转 / 分布式数据) | — | ❌ missing | P1 |
| 16 | Widget / 服务卡片 (FormExtensionAbility) | `widget.md` | 🟡 partial | P1 (upgrade) |
| 17 | 元服务 (Atomic Service) | — | ❌ missing | P2 |
| 18 | ArkTS 语言 (Language) | — | ❌ missing | P2 |
| 19 | ArkUI 状态管理 (`@State` / `@Prop` / `@Link` / `AppStorage` ...) | `state-management.md` | ✅ covered | maintain |
| 20 | ArkUI 动画 / 转场 / 手势 | `ui-implementation-rules.md`, `visual-effects-recipes.md` | 🟡 partial | P1 (split) |
| 21 | Canvas / 2D 绘制 | `visual-effects-recipes.md` | 🟡 partial | P1 |
| 22 | ArkGraphics 3D | `graphics-3d.md` | ✅ covered | maintain |
| 23 | 多媒体感知 (Multimodal Awareness Kit) | `official-api-examples.md` | 🟡 partial | P2 |
| 24 | 并发 (TaskPool / Worker) | — | ❌ missing | P1 |
| 25 | 调试与性能 (DevEco Studio / HiLog / Profiler) | — | ❌ missing | P1 |
| 26 | 测试 (HarmonyOS Test Framework) | — | ❌ missing | P1 |
| 27 | 上架与发布 (AppGallery Connect) | — | ❌ missing | P1 |
| 28 | 国际化 (i18n / l10n) | — | ❌ missing | P2 |
| 29 | 无障碍 (Accessibility) | — | ❌ missing | P2 |
| 30 | 跨设备 (手机 / 手表 / 平板 / 车机 / 电视) | — | ❌ missing | P2 |

## Coverage matrix — Skill-internal supporting files

These are not direct mirrors of official categories but are part of the skill workflow.

| File | Purpose | Status |
|---|---|---|
| `capability-map.md` | classify a request into an official capability domain | needs expansion to list every domain in this matrix |
| `api-watch.md` | reminder that official docs are the source of truth | OK |
| `official-search-playbook.md` | how to look up exact APIs from official docs | OK |
| `official-api-examples.md` | confirmed official URLs for high-frequency APIs | should grow over time |
| `coverage.md` | this file | current |

## Current coverage summary (audit baseline)

- official Guides domains in scope: 30
- domains fully covered (✅): 8 (UI development, ArkGraphics 3D, Permissions, Network, Persistence, Media & Camera, Notification, State Management)
- domains partially covered (🟡): 4 (App Model, Widget, ArkUI animation/gesture, Canvas)
- domains missing (❌): 18
- coverage ratio (full only): ~27%
- coverage ratio (full + partial): ~40%

## Priority guidance

### P0 — must-have engineering capability files
Any real HarmonyOS app will block on these. These are the highest-ROI gaps to fill first:

- ~~permissions.md~~ ✅ done
- ~~network.md~~ ✅ done
- ~~persistence.md~~ ✅ done
- ~~media-and-camera.md~~ ✅ done
- ~~notification.md~~ ✅ done
- ~~state-management.md~~ ✅ done

**P0 全部完成。**

### P1 — common but secondary
Important for full-featured apps:

- location.md
- distributed.md
- concurrency.md
- security-and-privacy.md
- background-tasks.md
- file-management.md
- testing.md
- debugging.md
- publishing.md
- widget-cookbook.md (upgrade widget.md)
- app-model.md (upgrade)
- animation-and-gesture.md (split out from current UI files)
- canvas.md (split out)

### P2 — long tail
Cover when product work touches them:

- arkts-language.md
- atomic-service.md
- resource-management.md
- design-guidelines.md
- i18n.md
- accessibility.md
- cross-device.md
- hap-har-hsp.md

## Audit rules

1. Every reference file should declare which official category it maps to.
2. Every reference file should include at least one official URL.
3. New reference files must update this matrix.
4. Removed reference files must update this matrix.
5. When the official Guides structure changes, update the matrix first, then plan content changes.
