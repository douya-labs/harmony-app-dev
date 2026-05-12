---
title: "Resource Management"
description: "读这个文件当： - 出现「字符串硬编码」「不同语言不同文案」「不同分辨率/暗色模式」「不同设备」需求 - 想做主题切换（dark mode / 多套配色） - 资源命名混乱，需要建立规范 - 报错出现 `getString` / `getColor` / `$r('app.string.xxx')` 相关问题"
sidebar:
  order: 13
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/resource-management.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/resource-management.md)

HarmonyOS 资源系统：strings / colors / images / themes / qualifier 资源的组织、引用、限定符匹配。

## Purpose

读这个文件当：
- 出现「字符串硬编码」「不同语言不同文案」「不同分辨率/暗色模式」「不同设备」需求
- 想做主题切换（dark mode / 多套配色）
- 资源命名混乱，需要建立规范
- 报错出现 `getString` / `getColor` / `$r('app.string.xxx')` 相关问题

资源系统是 HarmonyOS 应用国际化、主题化、多设备适配的基础设施，**任何想做规范化产品的应用都应该早期建立**。

## Capability mapping

- coverage 域：A3. 资源管理 (Resource Manager)
- 关联文件：`i18n.md`（国际化使用资源系统），`ui-implementation-rules.md`（不要硬编码颜色/文案）

## Official documentation entry points

- 资源分类与访问：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/resource-categories-and-access-V5
- 资源限定符：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/resource-categories-and-access-V5#section17841105914317
- ResourceManager API：https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-resource-manager-V5
- 主题（Theme）：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-resource-V5
- 暗色模式适配：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-color-mode-V5

## Concept model

### 资源目录结构

```
src/main/resources/
├── base/                   ← 默认资源（缺省 fallback）
│   ├── element/
│   │   ├── string.json     ← 字符串
│   │   ├── color.json      ← 颜色
│   │   └── float.json      ← 数值（dimension）
│   ├── media/              ← 图片 / svg
│   ├── profile/            ← 配置文件
│   └── layout/             ← 布局（旧式 XML，ArkUI 不常用）
├── en_US/                  ← 英文限定符
│   └── element/string.json
├── zh_CN/
├── dark/                   ← 暗色模式
│   └── element/color.json
└── sm/                     ← 小屏限定符
    └── element/float.json
```

### 限定符匹配优先级

系统加载资源时按以下优先级匹配（高 → 低）：
1. 设备语言 / 区域（zh_CN > zh > en_US > en）
2. 颜色模式（dark / light）
3. 屏幕密度（sdpi / mdpi / ldpi / xldpi）
4. 设备类型（phone / tablet / car / tv / wearable）
5. 屏幕方向（vertical / horizontal）
6. 屏幕尺寸（sm / md / lg）

匹配规则：**最具体的限定符优先**。如果限定符目录没有命中，**fallback 到 base/**。

### 资源引用语法

| 语法 | 用途 | 示例 |
|------|------|------|
| `$r('app.string.xxx')` | 字符串 | Text 组件文本 |
| `$r('app.color.xxx')` | 颜色 | `.fontColor()` |
| `$r('app.media.xxx')` | 图片资源 | Image 组件 |
| `$r('app.float.xxx')` | 数值 | `.width()` |
| `$rawfile('xxx.json')` | 原始文件 | 读取大文件 |

## Decision tree

```
要插入一段文本/颜色/图片到 UI?
├─ 是常量、固定不变 → 用普通字面量
└─ 可能多语言/多主题/多设备 → 走资源系统

要资源系统？
├─ 单一资源、不需要变体 → 放 base/
├─ 需要按语言变化 → 放 zh_CN/、en_US/
├─ 需要 dark mode → 放 dark/
├─ 需要按设备类型 → 放 phone/、tablet/
└─ 需要按屏幕大小 → 放 sm/、md/、lg/
```

## Implementation patterns

### Pattern 1: 字符串资源定义

```json
// resources/base/element/string.json
{
  "string": [
    { "name": "app_name", "value": "我的应用" },
    { "name": "welcome_user", "value": "欢迎，%s！" },
    { "name": "items_count", "value": "共 %d 个项目" }
  ]
}
```

```typescript
// 在 ArkTS 中使用
Text($r('app.string.app_name'))

// 带参数
Text($r('app.string.welcome_user', userName))
Text($r('app.string.items_count', 5))
```

### Pattern 2: 颜色 + 暗色模式

```json
// resources/base/element/color.json
{
  "color": [
    { "name": "background_primary", "value": "#FFFFFFFF" },
    { "name": "text_primary", "value": "#FF222222" }
  ]
}
```

```json
// resources/dark/element/color.json
{
  "color": [
    { "name": "background_primary", "value": "#FF1A1A1A" },
    { "name": "text_primary", "value": "#FFEEEEEE" }
  ]
}
```

```typescript
// ArkTS 中用相同 key，系统自动按当前模式选择
Column()
  .backgroundColor($r('app.color.background_primary'))

Text('hello').fontColor($r('app.color.text_primary'))
```

### Pattern 3: 多语言

```json
// resources/zh_CN/element/string.json
{ "string": [{ "name": "greeting", "value": "你好" }] }

// resources/en_US/element/string.json
{ "string": [{ "name": "greeting", "value": "Hello" }] }
```

切换设备语言后，应用自动加载对应语言的资源。

### Pattern 4: 编程式访问 ResourceManager

```typescript
import { common } from '@kit.AbilityKit';

const context = getContext(this) as common.UIAbilityContext;
const resMgr = context.resourceManager;

// 异步获取（推荐）
const greeting = await resMgr.getStringValue($r('app.string.greeting').id);

// 获取媒体资源
const mediaContent = await resMgr.getMediaContent($r('app.media.icon').id);

// 获取原始文件
const rawData = await resMgr.getRawFileContent('config.json');
```

### Pattern 5: 主题切换（应用内强制）

```typescript
import { ConfigurationConstant } from '@kit.AbilityKit';

// 强制设为暗色（覆盖系统设置）
context.getApplicationContext().setColorMode(
  ConfigurationConstant.ColorMode.COLOR_MODE_DARK
);

// 跟随系统
context.getApplicationContext().setColorMode(
  ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET
);
```

## Common pitfalls

### Pitfall 1: 硬编码字符串

```typescript
// ❌ 不规范
Text('登录')

// ✅ 规范
Text($r('app.string.login'))
```

后期想做国际化时，一行行找散落的硬编码字符串是噩梦。

### Pitfall 2: 颜色不走资源系统 → dark mode 抓瞎

```typescript
// ❌ 写死颜色，dark mode 下文字看不见
Text('hi').fontColor('#222222')

// ✅ 走资源
Text('hi').fontColor($r('app.color.text_primary'))
```

### Pitfall 3: 资源 key 命名混乱

建议命名规范：
- 字符串：`<scope>_<intent>`，如 `login_button_text`、`error_network_offline`
- 颜色：`<role>_<variant>`，如 `text_primary`、`brand_accent_hover`
- 图片：`<scope>_<usage>`，如 `home_banner_default`、`user_avatar_placeholder`

### Pitfall 4: 限定符目录没 fallback

如果只在 `dark/` 里定义了某个颜色，但 `base/` 没定义，**light 模式下找不到**会报错或显示默认值。

**规则**：base/ 必须包含**所有**资源 key 的默认值；限定符目录只覆盖需要变化的部分。

### Pitfall 5: 大文件不要进 element

`element/string.json` 是给小型短字符串用的。
- 大段文本（FAQ、协议）→ `rawfile/agreement.txt` + `getRawFileContent`
- 配置 JSON → `rawfile/config.json`

## Verification before commit

- [ ] 没有硬编码字符串（grep 中文 / 主要英文文案）
- [ ] 没有硬编码颜色十六进制
- [ ] base/ 目录包含所有资源的默认定义
- [ ] dark/ 至少覆盖了核心颜色 token
- [ ] 资源 key 命名遵循一致规范

## When to escalate to official docs

- 自定义限定符组合的优先级判定
- 资源覆盖（HSP/HAR 引入资源时的 merge 规则）
- 大型主题系统设计（多套品牌 / 商家定制）

参考 `official-search-playbook.md`。
