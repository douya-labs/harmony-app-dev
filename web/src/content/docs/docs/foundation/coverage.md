---
title: "Coverage Matrix"
description: "This file is the official coverage map for `harmony-app-dev`. It records:"
sidebar:
  order: 2
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/coverage.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/coverage.md)

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
| 1 | 应用模型 (Application Model / Stage 模型) | `app-model.md` | ✅ covered | maintain |
| 2 | 应用程序包 (HAP / HAR / HSP) | `packaging.md` | ✅ covered | maintain |
| 3 | UI 开发 (ArkUI 声明式 UI) | `ui-implementation-rules.md`, `visual-effects-recipes.md`, `example-cookbook.md`, `component-library-policy.md` | ✅ covered | maintain |
| 4 | UI 设计 (Design / HarmonyOS Design) | `ui-design.md` | ✅ covered | maintain |
| 5 | 资源管理 (Resource Manager) | `resource-management.md` | ✅ covered | maintain |
| 6 | 权限管理 (Ability Kit / Permissions) | `permissions.md` | ✅ covered | maintain |
| 7 | 网络 (Network Kit / @ohos.net.http) | `network.md` | ✅ covered | maintain |
| 8 | 数据管理 (ArkData: Preferences / RDB / KV) | `persistence.md` | ✅ covered | maintain |
| 9 | 文件管理 (Core File Kit) | `file-management.md` | ✅ covered | maintain |
| 10 | 媒体 (Camera Kit / Image Kit / Audio / Media Library) | `media-and-camera.md` | ✅ covered | maintain |
| 11 | 通知 (Notification Kit) | `notification.md` | ✅ covered | maintain |
| 12 | 后台任务 (Background Tasks Kit) | `background-tasks.md` | ✅ covered | maintain |
| 13 | 位置 (Location Kit) | `location.md` | ✅ covered | maintain |
| 14 | 安全 (Universal Keystore / 加密 / 隐私) | `security-and-privacy.md` | ✅ covered | maintain |
| 15 | 分布式 (Distributed Service Kit / 流转 / 分布式数据) | `distributed.md` | ✅ covered | maintain |
| 16 | Widget / 服务卡片 (FormExtensionAbility) | `widget.md`, `widget-cookbook.md` | ✅ covered | maintain |
| 17 | 元服务 (Atomic Service) | `atomic-service.md` | ✅ covered | maintain |
| 18 | ArkTS 语言 (Language) | `arkts-language.md` | ✅ covered | maintain |
| 19 | ArkUI 状态管理 (`@State` / `@Prop` / `@Link` / `AppStorage` ...) | `state-management.md` | ✅ covered | maintain |
| 20 | ArkUI 动画 / 转场 / 手势 | `animation-and-gesture.md`, `ui-implementation-rules.md`, `visual-effects-recipes.md` | ✅ covered | maintain |
| 21 | Canvas / 2D 绘制 | `canvas.md`, `visual-effects-recipes.md` | ✅ covered | maintain |
| 22 | ArkGraphics 3D | `graphics-3d.md` | ✅ covered | maintain |
| 23 | 多媒体感知 (Multimodal Awareness Kit) | `official-api-examples.md` | 🟡 partial | P2 |
| 24 | 并发 (TaskPool / Worker) | `concurrency.md` | ✅ covered | maintain |
| 25 | 调试与性能 (DevEco Studio / HiLog / Profiler) | `debugging.md` | ✅ covered | maintain |
| 26 | 测试 (HarmonyOS Test Framework) | `testing.md` | ✅ covered | maintain |
| 27 | 上架与发布 (AppGallery Connect) | `publishing.md` | ✅ covered | maintain |
| 28 | 国际化 (i18n / l10n) | `i18n.md` | ✅ covered | maintain |
| 29 | 无障碍 (Accessibility) | `accessibility.md` | ✅ covered | maintain |
| 30 | 跨设备 (手机 / 手表 / 平板 / 车机 / 电视) | `cross-device.md` | ✅ covered | maintain |

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
- domains fully covered (✅): 29
- domains partially covered (🟡): 1 (Multimodal Awareness)
- domains missing (❌): 0
- coverage ratio (full only): ~97%
- coverage ratio (full + partial): 100%

🎉 **30/30 全部覆盖。**

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

- ~~location.md~~ ✅ done
- ~~concurrency.md~~ ✅ done
- ~~security-and-privacy.md~~ ✅ done
- ~~background-tasks.md~~ ✅ done
- ~~file-management.md~~ ✅ done
- ~~testing.md~~ ✅ done
- ~~debugging.md~~ ✅ done
- ~~publishing.md~~ ✅ done
- ~~widget-cookbook.md~~ ✅ done
- ~~app-model.md~~ ✅ done (upgraded)
- ~~animation-and-gesture.md~~ ✅ done
- ~~canvas.md~~ ✅ done
- ~~distributed.md~~ ✅ done

**P1 全部完成。**

### P2 — long tail
Cover when product work touches them:

- ~~arkts-language.md~~ ✅ done
- ~~atomic-service.md~~ ✅ done
- ~~resource-management.md~~ ✅ done
- ~~ui-design.md~~ ✅ done (mapped from design-guidelines)
- ~~i18n.md~~ ✅ done
- ~~accessibility.md~~ ✅ done
- ~~cross-device.md~~ ✅ done
- ~~packaging.md~~ ✅ done (mapped from hap-har-hsp)

**P2 全部完成。**

## Audit rules

1. Every reference file should declare which official category it maps to.
2. Every reference file should include at least one official URL.
3. New reference files must update this matrix.
4. Removed reference files must update this matrix.
5. When the official Guides structure changes, update the matrix first, then plan content changes.
