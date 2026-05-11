# app-model

Consolidated from prior HarmonyOS app model notes and official documentation directions.

## Purpose

Use this file when the task involves app structure rather than just page visuals.

## Typical triggers

- page routing
- app/page organization
- UIAbility lifecycle
- app startup structure
- navigation behavior

## Core reminder

When a task stops being “how should this page look?” and becomes “how should this Harmony app be organized?”, switch to app model thinking.

## Common uses in visual demo apps

- organizing a home page plus many effect detail pages
- defining route names and navigation flow
- deciding where shared scaffolds and registries should live
- keeping the project structure maintainable for many demo pages

## Engineering rule

Use official app model / Stage model docs when routing, lifecycle, and app structure details matter. Do not infer these from generic frontend frameworks.

## Official documentation entry points

- Application Model overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/application-model-composition-V5
- Stage model basics: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/stage-model-development-overview-V5
- UIAbility lifecycle: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/uiability-lifecycle-V5
- Navigation (recommended for new apps): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/ts-basic-components-navigation-V5
- Router (legacy but still used): https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-router-V5
- module.json5 configuration: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/module-configuration-file-V5

## Routing decision

For new HarmonyOS apps, prefer `Navigation` component over the older `Router` API:

- `Navigation` integrates better with declarative ArkUI
- supports rich page stack manipulation
- works with shared element transitions
- `Router` still works and is acceptable for simple cases or legacy code

Verify exact API names from official references when implementing route push/replace/back, query parameter passing, or page state restoration.

## Capability mapping

This file maps to coverage matrix row: "应用模型 (Application Model / Stage 模型)".

