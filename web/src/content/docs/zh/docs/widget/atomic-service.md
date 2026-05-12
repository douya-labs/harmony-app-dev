---
title: "Atomic Service"
description: "读这个文件当： - 用户提到「免安装」「服务卡片直达」「扫码即用」 - 想把核心功能拆成「轻应用」让用户无门槛使用 - 关心 AppGallery 中元服务的分发与流量入口 - 与传统 HAP 应用做形态对比"
sidebar:
  order: 3
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/atomic-service.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/atomic-service.md)

HarmonyOS 元服务（Atomic Service）：免安装、轻量、跨设备分发的应用形态。

## Purpose

读这个文件当：
- 用户提到「免安装」「服务卡片直达」「扫码即用」
- 想把核心功能拆成「轻应用」让用户无门槛使用
- 关心 AppGallery 中元服务的分发与流量入口
- 与传统 HAP 应用做形态对比

⚠️ 元服务是 HarmonyOS 独有的轻量分发形态。**MVP 早期通常先做完整 HAP 应用**，元服务作为后期分发渠道补充。

## Capability mapping

- coverage 域：D2. 元服务 (Atomic Service)
- 关联文件：`packaging.md`（元服务的包结构限制），`widget.md`（服务卡片是元服务的重要入口），`publishing.md`（元服务上架流程）

## Official documentation entry points

- 元服务总览：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/atomicservice-overview-V5
- 元服务开发：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/atomicservice-V5
- 元服务分发与拉起：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/atomic-service-startup-V5
- 服务卡片与元服务：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/service-widget-overview-V5
- AppGallery 元服务上架：https://developer.huawei.com/consumer/cn/agconnect/

## Concept model

### 元服务 vs 普通应用

| 维度 | 元服务 | 普通 HAP 应用 |
|------|--------|--------------|
| 安装 | 免安装（系统按需缓存） | 必须安装 |
| 大小 | ≤ 10MB（严格限制） | 不限 |
| 入口 | 服务中心、扫码、卡片、流转 | 桌面图标、应用市场 |
| 权限 | 受限子集 | 完整权限 |
| 分发 | 即点即用 / 分享卡片 | 应用市场下载 |
| 适合场景 | 单一目的、轻量服务 | 完整功能应用 |

### 元服务的核心约束

1. **包大小**：单个元服务 HAP ≤ 10MB
2. **权限受限**：部分敏感权限不可用（如长时间后台、读取通讯录全量）
3. **架构限制**：必须基于 Stage Model；推荐用单 entry HAP
4. **入口限制**：不能添加桌面图标（用户主动「添加到桌面」除外）

### 触达路径

```
用户触达元服务的方式：
├─ 服务中心（系统级元服务列表）
├─ 服务卡片（添加在桌面，点击直达）
├─ 扫码（二维码 → 直接拉起）
├─ 流转（手机 → 平板继续）
├─ 链接分享（鸿蒙 deep link）
└─ 系统智能推荐（场景化推荐）
```

## Decision tree

```
当前需求是否适合元服务？

├─ 应用大小可压缩到 10MB 以内？
│   ├─ 否 → 用普通 HAP
│   └─ 是 → 进入 2
│
├─ 需求是否「单一目的、轻量服务」？
│   ├─ 否（功能复杂） → 用普通 HAP
│   └─ 是（如：天气查询、停车缴费、外卖菜单） → 进入 3
│
├─ 需要的权限是否在元服务允许范围内？
│   ├─ 否（如：长期后台监听） → 用普通 HAP
│   └─ 是 → 元服务合适

特殊情况：
├─ 需要服务卡片入口 → 元服务天然适合（也可在普通 HAP 中加 widget）
└─ 需要二维码/分享拉起 → 元服务的核心优势
```

## Implementation patterns

### Pattern 1: 元服务的项目骨架

DevEco Studio 创建：File → New → Create Project → 选择 **Atomic Service** 模板。

```
atomicService/
├── entry/
│   ├── src/main/
│   │   ├── ets/
│   │   │   ├── entryability/
│   │   │   │   └── EntryAbility.ets
│   │   │   └── pages/
│   │   │       └── Index.ets
│   │   ├── module.json5
│   │   └── resources/
│   └── oh-package.json5
├── AppScope/
│   └── app.json5
└── build-profile.json5
```

### Pattern 2: 标记为元服务

```json
// AppScope/app.json5
{
  "app": {
    "bundleName": "com.example.atomic",
    "vendor": "example",
    "versionCode": 1,
    "versionName": "1.0.0",
    "icon": "$media:app_icon",
    "label": "$string:app_name",
    "atomicService": {
      "mainPage": "pages/Index"
    }
  }
}
```

```json
// entry/src/main/module.json5
{
  "module": {
    "name": "entry",
    "type": "entry",
    "deliveryWithInstall": true,
    "installationFree": true,  // 关键：标记为免安装
    "abilities": [{
      "name": "EntryAbility",
      "srcEntry": "./ets/entryability/EntryAbility.ets",
      ...
    }]
  }
}
```

### Pattern 3: 元服务首屏要求

元服务推荐首屏快速展示核心功能。例如停车缴费元服务：

```typescript
@Entry
@Component
struct ParkingService {
  @State plateNumber: string = '';

  build() {
    Column() {
      // 直接展示输入区，不要弹欢迎屏
      Text('车牌号查询')
        .fontSize(24)
        .margin({ top: 32 })

      TextInput({ placeholder: '请输入车牌号' })
        .onChange((value) => this.plateNumber = value)

      Button('立即查询')
        .onClick(() => this.queryParking())
    }
    .padding(16)
  }

  async queryParking() { /* ... */ }
}
```

### Pattern 4: 元服务的服务卡片入口

元服务必须配套提供至少一个**服务卡片**作为快捷入口（用户可添加到桌面）：

```typescript
// EntryFormAbility.ets
import FormExtensionAbility from '@ohos.app.form.FormExtensionAbility';

export default class EntryFormAbility extends FormExtensionAbility {
  onAddForm(want) {
    return {
      'data': JSON.stringify({ status: 'idle' })
    };
  }

  onUpdateForm(formId) {
    // 卡片刷新（5min ~ 24h 间隔）
  }
}
```

参考 `widget.md` 与 `widget-cookbook.md` 学习卡片实现细节。

### Pattern 5: 通过 deep link 拉起元服务

```typescript
import common from '@ohos.app.ability.common';

const want = {
  bundleName: 'com.example.atomic',
  abilityName: 'EntryAbility',
  parameters: {
    plateNumber: '京A12345'  // 透传参数
  },
  uri: 'atomicservice://com.example.atomic/parking?plate=京A12345'
};

await context.startAbility(want);
```

### Pattern 6: 包体积控制

```javascript
// build-profile.json5 - 优化输出大小
{
  "app": {
    "products": [{
      "name": "default",
      "buildOption": {
        "arkOptions": {
          "byteCodeHar": true  // 字节码混淆
        }
      }
    }]
  },
  "modules": [{
    "name": "entry",
    "targets": [{
      "name": "default",
      "applyToProducts": ["default"],
      "buildOption": {
        "resOptions": {
          "compression": {
            "media": { "format": "webp", "exclude": [".gif"] }
          }
        }
      }
    }]
  }]
}
```

⚠️ 严禁打包大型字体、视频。
- 图标用 SVG 而非 PNG
- 图片用 webp 替代 png/jpg
- 字体用系统字体（不内嵌）
- 第三方依赖：能砍就砍

## Common pitfalls

### Pitfall 1: 包大小超过 10MB

打包后用 DevEco Studio 的 Build Analyzer 查看占大头的资源：
- 大概率是图片、字体、第三方 SDK
- 拆分 / 压缩 / 改用 HSP 引用

### Pitfall 2: 在元服务里使用敏感权限

例如「长时间后台」「全量通讯录」「设备指纹」等，在元服务中**不可用**或被严格审核拒绝。
- 如必须用 → 重新评估是否应该做成普通 HAP

### Pitfall 3: 首屏 loading 时间长

元服务用户期望「即点即用」。
- 严控启动速度 < 1s
- 不要在首屏发起多个网络请求
- 用骨架屏占位

### Pitfall 4: 没提供服务卡片

很多用户通过桌面卡片访问元服务。**没有卡片 = 用户用一次就忘**。

### Pitfall 5: 误以为元服务能完全替代应用

元服务是「轻服务直达」，不是「完整应用」。复杂业务流（订单、客服、IM）仍应做成普通 HAP，元服务作为流量入口引导。

### Pitfall 6: 上架审核被拒

元服务有更严格的审核要求：
- 必须有清晰的核心服务定位（不能是「试试看」app）
- 必须配置服务卡片
- 必须遵守隐私协议（即使是免安装）

## Verification before commit

- [ ] `installationFree: true` 已配置
- [ ] 包大小 < 10MB（构建后查看）
- [ ] 启动速度 < 1s（首屏可见）
- [ ] 至少配置 1 个服务卡片
- [ ] 不依赖元服务禁用的权限
- [ ] 隐私协议链接 / 文案完整

## When to escalate to official docs

- 元服务专属的智能推荐与分发机制
- 元服务跨设备流转的特殊配置
- 元服务在不同设备类型（手机 / 平板 / 手表）的形态差异
- 元服务与小艺（语音助手）联动
- 元服务上架审核细则

参考官方「元服务开发指南」与 AppGallery Connect 文档。
