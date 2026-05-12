---
title: "Cross-Device"
description: "读这个文件当： - 应用要支持多种设备类型 - 需要响应式 UI（不同屏幕尺寸 / 横竖屏自动调整） - 折叠屏展开/收起的 UI 切换 - 手表 / 车机的极简 UI 重新设计"
sidebar:
  order: 7
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/cross-device.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/cross-device.md)

HarmonyOS 跨设备形态适配：手机 / 平板 / 折叠屏 / 手表 / 车机 / 电视的 UI 与逻辑差异。

## Purpose

读这个文件当：
- 应用要支持多种设备类型
- 需要响应式 UI（不同屏幕尺寸 / 横竖屏自动调整）
- 折叠屏展开/收起的 UI 切换
- 手表 / 车机的极简 UI 重新设计

⚠️ 这个文件管「**同一应用在不同设备形态**」上的差异；与 `distributed.md`（不同设备协同）是两个不同维度。

## Capability mapping

- coverage 域：D3. 跨设备 (手机 / 手表 / 平板 / 车机 / 电视)
- 关联文件：`packaging.md`（Feature HAP 按 deviceType 分发），`resource-management.md`（限定符按设备类型）

## Official documentation entry points

- 跨设备应用开发：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/cross-device-application-overview-V5
- 一多开发（一次开发多端部署）：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/multi-device-app-dev-V5
- 响应式布局：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/responsive-layout-V5
- 折叠屏适配：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/foldable-screen-development-V5
- 媒体查询 mediaquery：https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-mediaquery-V5
- 屏幕方向适配：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/screen-orientation-V5

## Concept model

### 设备类型矩阵

| 设备 | deviceType | 屏幕尺寸 | 输入方式 | UI 倾向 |
|------|-----------|---------|---------|--------|
| 手机 | phone | 6-7 寸 | 触控 | 单列堆叠 |
| 折叠屏 | phone(折)/tablet(展) | 切换 | 触控 | 自适应栏 |
| 平板 | tablet | 10-13 寸 | 触控 | 双列 / 三列 |
| 手表 | wearable | 1-2 寸 | 触控+表冠 | 极简列表 |
| 车机 | car | 大屏横向 | 触控+物理按键 | 大字大按钮 |
| 电视 | tv | 50+ 寸 | 遥控器 | 焦点导航 |

### 响应式布局的核心断点

```
sm  : 0   ≤ width < 600 vp   ← 手机
md  : 600 ≤ width < 840 vp   ← 折叠屏展开 / 小平板
lg  : 840 ≤ width            ← 平板 / 车机大屏
```

### 一多开发（One Develop, Multi-deploy）的层次

```
顶层：业务逻辑（共享）
   ↓
中层：UI 适配层（响应式 / 多布局）
   ↓
底层：设备特化（按 deviceType 提供专属实现）
```

## Decision tree

```
应用需要跨多少种设备？
├─ 仅手机 → 不需要做 cross-device
├─ 手机 + 平板 → 响应式布局即可
├─ + 手表 → 拆 Feature HAP，手表用极简 UI
└─ + 车机/电视 → 较大改造，单独的 deviceType HAP

折叠屏需要响应吗？
├─ 否 → 默认按 phone 布局即可
└─ 是 → 监听 displayMode + 用 GridRow 重排

横竖屏需要切换布局？
├─ 否（仅竖屏） → 在 module.json5 锁定方向
└─ 是 → 监听 onWindowSizeChange / mediaquery
```

## Implementation patterns

### Pattern 1: GridRow 响应式栅格

```typescript
import { GridRow, GridCol } from '@kit.ArkUI';

GridRow({
  columns: { sm: 4, md: 8, lg: 12 },     // 不同断点用不同列数
  gutter: { x: 12, y: 12 }
}) {
  ForEach(items, (item) => {
    GridCol({ span: { sm: 4, md: 4, lg: 3 } }) {  // 手机占 4=全宽，平板每行 3 个
      ItemCard({ data: item })
    }
  })
}
```

### Pattern 2: mediaquery 监听断点

```typescript
import mediaquery from '@ohos.mediaquery';

@Entry
@Component
struct ResponsivePage {
  @State isLargeScreen: boolean = false;
  private listener = mediaquery.matchMediaSync('(min-width: 600vp)');

  aboutToAppear() {
    this.listener.on('change', (result: mediaquery.MediaQueryResult) => {
      this.isLargeScreen = result.matches;
    });
  }

  aboutToDisappear() {
    this.listener.off('change');
  }

  build() {
    if (this.isLargeScreen) {
      this.LargeScreenLayout()
    } else {
      this.PhoneLayout()
    }
  }

  @Builder LargeScreenLayout() { /* 双栏 */ }
  @Builder PhoneLayout() { /* 单栏 */ }
}
```

### Pattern 3: 折叠屏展开/收起监听

```typescript
import display from '@ohos.display';

aboutToAppear() {
  display.on('foldStatusChange', (status: display.FoldStatus) => {
    switch (status) {
      case display.FoldStatus.FOLD_STATUS_FOLDED:
        this.layoutMode = 'phone';
        break;
      case display.FoldStatus.FOLD_STATUS_EXPANDED:
        this.layoutMode = 'tablet';
        break;
      case display.FoldStatus.FOLD_STATUS_HALF_FOLDED:
        this.layoutMode = 'half';  // 帐篷模式
        break;
    }
  });
}
```

### Pattern 4: 屏幕方向控制

```json
// module.json5 - 锁定竖屏
{
  "abilities": [{
    "orientation": "portrait",  // 或 "landscape" / "auto_rotation"
    ...
  }]
}
```

```typescript
// 运行时切换
import window from '@ohos.window';

const win = await window.getLastWindow(this.context);
await win.setPreferredOrientation(window.Orientation.LANDSCAPE);
```

### Pattern 5: 按 deviceType 拆 Feature HAP

```
project/
├── entry/         ← phone（必须有）
├── tabletEntry/   ← tablet 专属 UI
├── watchEntry/    ← wearable 极简 UI
└── shared/        ← HAR 共享业务逻辑
```

```json
// watchEntry/src/main/module.json5
{
  "module": {
    "name": "watchEntry",
    "type": "feature",
    "deviceTypes": ["wearable"],
    ...
  }
}
```

### Pattern 6: 资源按 deviceType 限定符

```
resources/
├── base/             ← 默认（手机）
│   └── element/float.json (icon_size: 24)
├── tablet/
│   └── element/float.json (icon_size: 32)
└── wearable/
    └── element/float.json (icon_size: 16)
```

代码不变：`Image().width($r('app.float.icon_size'))`，系统按设备类型自动选择。

### Pattern 7: 安全区域适配（折叠屏 / 异形屏）

```typescript
import { window } from '@kit.ArkUI';

const avoidArea = window.AvoidAreaType.TYPE_SYSTEM;
const area = win.getWindowAvoidArea(avoidArea);

// 在容器上避开状态栏、导航栏、刘海
Column()
  .padding({
    top: area.topRect.height,
    bottom: area.bottomRect.height
  })
```

## Common pitfalls

### Pitfall 1: 用 px 写死尺寸

px 是物理像素，不同 DPI 下显示不同。**永远用 vp（虚拟像素）或 fp（字体）**。

```typescript
// ❌
.width(200)  // 数字默认是 vp，但要表达清楚
.width('200px')  // 错，物理像素

// ✅
.width(200)         // 默认 vp
.width('200vp')     // 显式
.fontSize('14fp')   // 字体用 fp
```

### Pitfall 2: 在 phone 上写死「右侧抽屉」

平板大屏上抽屉应该是常驻侧栏。响应式应该在 lg 断点切换布局。

### Pitfall 3: 横屏没测试

很多布局只在竖屏好看，横屏时挤压变形。开发时至少要：
- 旋转模拟器测一遍
- 折叠屏：折叠 + 展开都要测

### Pitfall 4: 手表照搬手机 UI

手表屏太小，不能用密集的列表。手表 UI 应：
- 单层信息，避免嵌套滑动
- 关键信息一眼可见
- 操作不超过 1-2 步
- 用表冠（rotation crown）替代精细滑动

### Pitfall 5: 车机忽略安全要求

车机应用必须考虑驾驶安全：
- 字体显著加大
- 关键操作 ≤ 1 次点击
- 行驶状态下可能禁用部分功能

### Pitfall 6: 响应式只看宽度，忽略高度

横屏时高度变小，竖向滚动可能溢出可视区。应同时检查 height 维度。

## Verification before commit

- [ ] 至少 3 个断点（sm/md/lg）的视觉验收
- [ ] 不使用 px 单位
- [ ] 折叠屏展开/收起切换无错位
- [ ] 横竖屏切换不丢状态
- [ ] 资源用限定符目录组织设备特化变体
- [ ] 多 deviceType 应用通过 Feature HAP 隔离
- [ ] 边距使用 GridRow gutter 而不是手算

## When to escalate to official docs

- 车机 / 电视应用的认证与发布特殊要求
- HarmonyOS NEXT 与 HarmonyOS 4 在 cross-device 上的能力差异
- 自定义 BreakpointSystem
- 异形屏（打孔屏 / 瀑布屏）的安全区算法

参考 `official-search-playbook.md`。
