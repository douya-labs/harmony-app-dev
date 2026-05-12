---
title: "Accessibility"
description: "读这个文件当： - 应用面向 C 端、需要符合无障碍法规 - 用户群体含视力 / 听力 / 运动障碍 - AppGallery 上架前的合规审查 - UI 上有图标按钮 / 自定义控件 / 复杂视觉元素"
sidebar:
  order: 9
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/accessibility.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/accessibility.md)

HarmonyOS 无障碍能力：屏幕阅读器（ScreenReader）、大字体、对比度、辅助操作。

## Purpose

读这个文件当：
- 应用面向 C 端、需要符合无障碍法规
- 用户群体含视力 / 听力 / 运动障碍
- AppGallery 上架前的合规审查
- UI 上有图标按钮 / 自定义控件 / 复杂视觉元素

无障碍**不是 nice-to-have**——大部分国家有合规要求，且约 15% 用户有不同程度的障碍。MVP 阶段做基础 accessibility 不会增加多少成本。

## Capability mapping

- coverage 域：E5. 无障碍 (Accessibility)
- 关联文件：`ui-implementation-rules.md`（组件设计要预留无障碍标签），`i18n.md`（无障碍文案也要本地化）

## Official documentation entry points

- 无障碍总览：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/accessibility-overview-V5
- 无障碍属性使用：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-accessibility-V5
- 屏幕朗读：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/screenreader-introduction-V5
- AccessibilityExtensionAbility：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/accessibilityextensionability-V5
- 无障碍设计规范：https://developer.huawei.com/consumer/cn/doc/design-guides/accessibility-overview-0000001761021497

## Concept model

### 三个维度

```
1. 视觉障碍
   ├─ 屏幕阅读器（ScreenReader）：读出 UI 内容
   ├─ 大字体：用户系统级放大文字
   └─ 高对比度：色觉障碍 / 弱视

2. 听觉障碍
   └─ 视频字幕、提示音的视觉替代

3. 运动障碍
   ├─ 大点击区域（≥ 44x44 vp）
   ├─ 长按可配置时长
   └─ 不依赖复杂手势
```

### 关键 ArkUI 属性

| 属性 | 作用 |
|------|------|
| `.accessibilityText(string)` | 设置朗读文本（覆盖默认朗读内容） |
| `.accessibilityDescription(string)` | 朗读后补充说明 |
| `.accessibilityLevel('yes' / 'no' / 'no-hide-descendants')` | 是否参与无障碍树 |
| `.accessibilityGroup(boolean)` | 把子组件合并为一个无障碍节点 |

## Decision tree

```
组件类型？

├─ 纯文本 Text → 默认会朗读，不需特别处理
│
├─ Image / 图标 →
│   ├─ 装饰性（无信息） → .accessibilityLevel('no')
│   └─ 携带信息 → .accessibilityText('图标含义')
│
├─ 按钮 / 可点击区域 →
│   ├─ 内有可见文字 → 默认即可
│   └─ 仅图标按钮 → .accessibilityText('返回' / '搜索' / '设置')
│
├─ 自定义复合组件（多个子元素表达单一含义）→
│   .accessibilityGroup(true) + .accessibilityText('整体含义')
│
└─ 装饰性容器 / 背景 → .accessibilityLevel('no')
```

## Implementation patterns

### Pattern 1: 图标按钮加朗读文本

```typescript
// ❌ 屏幕阅读器只会读出 "图片"
Button({ type: ButtonType.Circle }) {
  Image($r('app.media.ic_search'))
}

// ✅ 明确朗读文本
Button({ type: ButtonType.Circle }) {
  Image($r('app.media.ic_search'))
}
.accessibilityText('搜索')  // 屏幕阅读器朗读：「搜索 按钮」
```

### Pattern 2: 装饰性图片屏蔽朗读

```typescript
Image($r('app.media.bg_decoration'))
  .accessibilityLevel('no')  // 屏幕阅读器跳过
```

### Pattern 3: 复合组件合并

```typescript
// 一个商品卡：图片 + 标题 + 价格 + 折扣
// 默认会被读 4 次，体验差

Column() {
  Image(item.imageUrl)
  Text(item.title)
  Text(`¥${item.price}`)
  Text(`${item.discount}% off`)
}
.accessibilityGroup(true)
.accessibilityText(`${item.title}，售价 ${item.price} 元，折扣 ${item.discount}%`)
.accessibilityDescription('双击进入商品详情')
```

### Pattern 4: 状态变化的播报

```typescript
import { accessibility } from '@kit.AccessibilityKit';

// 比如：购物车数量变化时主动播报
function onAddToCart(itemName: string) {
  accessibility.sendAccessibilityEvent({
    type: 'announcement',
    bundleName: 'com.example.myapp',
    triggerAction: 'click',
    accessibilityText: `已添加 ${itemName} 到购物车`
  });
}
```

### Pattern 5: 大字体兼容

```typescript
// ❌ 固定 fontSize 不响应系统字体放大
Text('hello').fontSize(14)

// ✅ 用 fp 单位（自动跟随系统字体大小）
Text('hello').fontSize('14fp')  // 默认就是 fp，但显式写更清晰

// ✅ 容器宽度允许换行，不要固定 height
Text('一段可能被放大的文本')
  .fontSize('14fp')
  .maxLines(3)
  .textOverflow({ overflow: TextOverflow.Ellipsis })
```

### Pattern 6: 颜色对比度

不要单独用颜色传达关键信息（色盲用户无法识别）：

```typescript
// ❌ 仅靠红/绿色区分成功失败
Text('订单状态').fontColor(success ? '#00FF00' : '#FF0000')

// ✅ 颜色 + 图标 + 文字三重信息
Row() {
  Image(success ? $r('app.media.ic_check') : $r('app.media.ic_warning'))
  Text(success ? '已完成' : '失败')
    .fontColor($r('app.color.text_primary'))
}
```

WCAG 推荐对比度：
- 正文：≥ 4.5:1
- 大字（18pt+）：≥ 3:1

### Pattern 7: 点击区域大小

```typescript
// ❌ 太小，肢体不灵活的用户难以点中
Image($r('app.media.ic_close'))
  .width(20).height(20)
  .onClick(...)

// ✅ 视觉上还是 20x20，但点击区域 44x44
Image($r('app.media.ic_close'))
  .width(20).height(20)
  .padding(12)  // 总尺寸变 44x44
  .onClick(...)
```

## Common pitfalls

### Pitfall 1: 自定义控件忘记 accessibilityText

任何用 `Image + onClick` 组合的「土制按钮」都需要补 `accessibilityText`，否则屏幕阅读器只朗读「图片」。

### Pitfall 2: 列表项目朗读冗余

```typescript
// ❌ 每个 ListItem 内部多个 Text 各自朗读
ForEach(items, (item) => {
  ListItem() {
    Column() {
      Text(item.title)
      Text(item.subtitle)
      Text(item.timestamp)
    }
  }
})

// ✅ 合并为一个朗读节点
ForEach(items, (item) => {
  ListItem() {
    Column() {
      Text(item.title)
      Text(item.subtitle)
      Text(item.timestamp)
    }
    .accessibilityGroup(true)
    .accessibilityText(`${item.title}，${item.subtitle}，${item.timestamp}`)
  }
})
```

### Pitfall 3: 图标语义随上下文变化

```typescript
// 同一个 ic_more 图标，不同位置含义不同
// ✅ 在不同位置给不同 accessibilityText
Image($r('app.media.ic_more'))
  .accessibilityText('更多操作')  // 列表项右侧

Image($r('app.media.ic_more'))
  .accessibilityText('展开评论')  // 评论区域
```

### Pitfall 4: 弹窗/Toast 不被朗读

弹窗出现时，屏幕阅读器需要主动播报。检查弹窗组件是否会自动获取焦点（accessibility focus），否则用 `sendAccessibilityEvent` 主动通告。

### Pitfall 5: 视频/动画无替代信息

- 视频应提供字幕（subtitles）
- 关键动画应有文字描述备用
- 提示音必须搭配视觉提示

## Verification before commit

- [ ] 所有图标按钮都有 `accessibilityText`
- [ ] 装饰性图片标记 `.accessibilityLevel('no')`
- [ ] 复合卡片用 `.accessibilityGroup(true)` 合并朗读
- [ ] 字体大小用 fp 单位
- [ ] 关键交互的点击区域 ≥ 44x44 vp
- [ ] 颜色 + 图标 / 文字三重表达，不单独用颜色
- [ ] 用屏幕阅读器（设置 → 无障碍 → 朗读）实测核心流程

## When to escalate to official docs

- 自定义 Component 实现 ArkUI 默认无支持的无障碍语义
- AccessibilityExtensionAbility（开发自定义辅助应用）
- 复杂图表 / Canvas 绘制内容的无障碍替代方案
- 大型应用的全站无障碍审计流程

参考 `official-search-playbook.md` 与官方设计规范。
