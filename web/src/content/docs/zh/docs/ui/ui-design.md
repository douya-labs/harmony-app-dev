---
title: "UI Design Principles"
description: "读这个文件当： - 不确定按钮 / 卡片 / 弹窗的视觉规格 - 设计稿没标注具体值，需要参考官方默认 - 想做 HarmonyOS 原生感的应用而不是「自定义皮肤」 - 与设计师沟通需要共同的设计 token 词汇"
sidebar:
  order: 1
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/ui-design.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/ui-design.md)

HarmonyOS Design 设计规范：栅格、间距、字体、色板、组件视觉语言对齐。

## Purpose

读这个文件当：
- 不确定按钮 / 卡片 / 弹窗的视觉规格
- 设计稿没标注具体值，需要参考官方默认
- 想做 HarmonyOS 原生感的应用而不是「自定义皮肤」
- 与设计师沟通需要共同的设计 token 词汇

⚠️ 这个文件是「**视觉规范索引**」，不是「具体组件用法」（那部分看 `ui-implementation-rules.md` 和 `component-library-policy.md`）。

## Capability mapping

- coverage 域：B8. UI 设计 (Design / HarmonyOS Design)
- 关联文件：
  - `ui-implementation-rules.md`（实现规则）
  - `component-library-policy.md`（用什么组件库）
  - `resource-management.md`（设计 token 怎么落到资源系统）
  - `accessibility.md`（设计也要符合无障碍要求）

## Official documentation entry points

- HarmonyOS Design 总览：https://developer.huawei.com/consumer/cn/doc/design-guides/
- 设计原则：https://developer.huawei.com/consumer/cn/doc/design-guides/design-principles-0000001949859741
- 视觉规范（颜色 / 字体 / 间距）：https://developer.huawei.com/consumer/cn/doc/design-guides/visual-style-0000001949859745
- 控件规范：https://developer.huawei.com/consumer/cn/doc/design-guides/components-overview-0000001761501937
- 一多设计（多设备）：https://developer.huawei.com/consumer/cn/doc/design-guides/cross-device-design-overview-0000001761021501
- 无障碍设计：https://developer.huawei.com/consumer/cn/doc/design-guides/accessibility-overview-0000001761021497

## Concept model

### 设计层次

```
1. 设计原则（哲学层）
   - 一致性、易用性、效率、美感

2. 设计 Token（变量层）
   - color tokens（语义颜色）
   - typography tokens（字号、字重、行高）
   - spacing tokens（间距阶梯）
   - radius tokens（圆角阶梯）
   - elevation tokens（阴影层级）

3. 组件规范（应用层）
   - 按钮、卡片、列表、弹窗
   - 状态：default / hover / pressed / disabled
```

### 关键栅格基线

```
间距系统：4 vp 基础单位
   ├─ 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

字号阶梯（fp）：
   ├─ caption    : 11 fp
   ├─ body3      : 12 fp
   ├─ body2      : 14 fp
   ├─ body1      : 16 fp（默认正文）
   ├─ subtitle3  : 18 fp
   ├─ subtitle2  : 20 fp
   ├─ subtitle1  : 24 fp
   ├─ headline   : 28 fp
   └─ display    : 36+ fp

圆角阶梯（vp）：
   ├─ 4  : 标签、小元素
   ├─ 8  : 按钮、输入框
   ├─ 12 : 卡片
   ├─ 16 : 大卡片、弹窗
   └─ 24 : 全圆角胶囊
```

### 颜色语义层（推荐做法）

```
brand_primary       ← 品牌主色
brand_secondary     ← 辅色

text_primary        ← 主要文字
text_secondary      ← 次要文字
text_tertiary       ← 弱化文字
text_inverse        ← 反色文字（深底白字）

bg_primary          ← 主背景
bg_secondary        ← 次级背景
bg_tertiary         ← 卡片背景
bg_emphasize        ← 强调背景

border_default
border_emphasize

success / warning / danger / info
```

⚠️ 不要直接用 `#FF0000` 等十六进制；都通过 token 引用。

## Decision tree

```
设计稿没标注具体值？
└→ 参考 HarmonyOS Design 默认值

字号选择？
├─ 标题 → headline / subtitle1
├─ 正文 → body1 (16fp) / body2 (14fp)
└─ 辅助 → caption (11fp)

间距选择？
├─ 元素紧密相关 → 4 / 8
├─ 同区块内 → 12 / 16
├─ 区块之间 → 24 / 32
└─ 大区域分隔 → 48 / 64

按钮风格？
├─ 主操作 → Filled（实心）+ brand_primary
├─ 次操作 → Outline（描边）
├─ 辅助 → Text（文字）
└─ 危险 → Filled + danger
```

## Implementation patterns

### Pattern 1: 在资源系统建立设计 Token

```json
// resources/base/element/color.json
{
  "color": [
    { "name": "brand_primary", "value": "#FF0A59F7" },
    { "name": "text_primary", "value": "#FF1A1A1A" },
    { "name": "text_secondary", "value": "#99000000" },
    { "name": "bg_primary", "value": "#FFFFFFFF" },
    { "name": "bg_card", "value": "#FFF7F8FA" },
    { "name": "border_default", "value": "#33000000" }
  ]
}

// resources/base/element/float.json
{
  "float": [
    { "name": "spacing_xs", "value": "4vp" },
    { "name": "spacing_sm", "value": "8vp" },
    { "name": "spacing_md", "value": "16vp" },
    { "name": "spacing_lg", "value": "24vp" },
    { "name": "spacing_xl", "value": "32vp" },

    { "name": "font_caption", "value": "11fp" },
    { "name": "font_body", "value": "16fp" },
    { "name": "font_title", "value": "20fp" },

    { "name": "radius_sm", "value": "8vp" },
    { "name": "radius_md", "value": "12vp" },
    { "name": "radius_lg", "value": "16vp" }
  ]
}
```

### Pattern 2: 卡片基础规格

```typescript
// 标准卡片
Column() {
  Text('卡片标题')
    .fontSize($r('app.float.font_title'))
    .fontColor($r('app.color.text_primary'))
    .fontWeight(FontWeight.Medium)

  Text('副标题或描述文本')
    .fontSize($r('app.float.font_body'))
    .fontColor($r('app.color.text_secondary'))
    .margin({ top: $r('app.float.spacing_xs') })
}
.padding($r('app.float.spacing_md'))
.backgroundColor($r('app.color.bg_card'))
.borderRadius($r('app.float.radius_md'))
.width('100%')
```

### Pattern 3: 按钮三态

```typescript
// 主操作（Filled）
Button('确认提交')
  .type(ButtonType.Capsule)
  .backgroundColor($r('app.color.brand_primary'))
  .fontColor($r('app.color.text_inverse'))
  .fontSize($r('app.float.font_body'))
  .height(48)

// 次操作（Outline）
Button('取消')
  .type(ButtonType.Capsule)
  .backgroundColor(Color.Transparent)
  .borderWidth(1)
  .borderColor($r('app.color.border_default'))
  .fontColor($r('app.color.text_primary'))

// 文字按钮
Button('了解更多')
  .type(ButtonType.Normal)
  .backgroundColor(Color.Transparent)
  .fontColor($r('app.color.brand_primary'))
```

### Pattern 4: 阴影层级（elevation）

```typescript
// 浅阴影（卡片悬浮）
.shadow({ radius: 8, color: '#1A000000', offsetY: 2 })

// 中阴影（弹出菜单）
.shadow({ radius: 16, color: '#26000000', offsetY: 4 })

// 深阴影（模态弹窗）
.shadow({ radius: 24, color: '#33000000', offsetY: 8 })
```

### Pattern 5: 安全间距

```typescript
// 内容应避开屏幕边缘 16vp
Column() { ... }
  .padding({ left: 16, right: 16 })

// 状态栏 / 导航栏避让
import { window } from '@kit.ArkUI';
const area = win.getWindowAvoidArea(window.AvoidAreaType.TYPE_SYSTEM);
.padding({ top: area.topRect.height })
```

## Common pitfalls

### Pitfall 1: 不用 token，到处硬编码

```typescript
// ❌ 三个月后想改主色：要改 50 个文件
.backgroundColor('#FF0A59F7')

// ✅ 改 1 个 color.json 即可
.backgroundColor($r('app.color.brand_primary'))
```

### Pitfall 2: 字号阶梯混乱

设计稿出现 `13fp` `15fp` `17fp` 等不规范字号 → 拒绝执行，要求设计师对齐到标准字号阶梯。

### Pitfall 3: 间距杂乱（11vp / 13vp / 17vp）

强制对齐 4vp 基线。任何间距都应是 `4 * n` 的形式。

### Pitfall 4: 按钮 / 控件高度不规范

主要交互控件高度应统一：
- 主按钮：48 vp
- 次级按钮：40 vp
- 输入框：48 vp（与主按钮对齐）
- 标签：24 vp

### Pitfall 5: 用 Image 实现纯色背景

```typescript
// ❌
Image($r('app.media.bg_red'))

// ✅
Column().backgroundColor($r('app.color.bg_red'))
```

### Pitfall 6: 不做暗色模式时仍用强对比纯黑/纯白

强对比眼睛累。即使浅色模式也建议：
- 背景：`#F7F8FA` 而非 `#FFFFFF`
- 文字主色：`#1A1A1A` 而非 `#000000`

## Verification before commit

- [ ] 所有颜色走 `$r('app.color.xxx')`
- [ ] 所有间距走 `$r('app.float.spacing_xxx')` 或 4vp 倍数
- [ ] 字号在标准阶梯内（11/12/14/16/18/20/24/28/36）
- [ ] 圆角在标准阶梯内（4/8/12/16/24）
- [ ] 主按钮高度 48vp
- [ ] 同时跑 light + dark 模式
- [ ] 与 HarmonyOS 系统应用对比（设置、相机、画廊）感受是否「同源」

## When to escalate to official docs

- 高级设计语言（动效、过渡、微交互曲线）
- 设备特化（折叠屏、车机、电视）的设计差异
- 品牌方对鸿蒙应用的视觉合规要求
- 高级组件（Calendar、Picker、Sheet）的视觉规格

参考 HarmonyOS Design 官方设计指南。
