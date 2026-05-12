---
title: "Packaging: HAP / HAR / HSP"
description: "读这个文件当： - 项目从「单 module」准备拆成多 module - 出现「公共代码 / UI 复用 / 动态特性」需求 - AppGallery 上架前需要确认包体积与拆包策略 - 报错涉及 `module.json5` 配置或包之间引用关系"
sidebar:
  order: 11
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/packaging.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/packaging.md)

HarmonyOS 应用程序包模型：HAP / HAR / HSP 的拆分、依赖、动态加载策略。

## Purpose

读这个文件当：
- 项目从「单 module」准备拆成多 module
- 出现「公共代码 / UI 复用 / 动态特性」需求
- AppGallery 上架前需要确认包体积与拆包策略
- 报错涉及 `module.json5` 配置或包之间引用关系

不要把 packaging 当「构建系统优化」——它的本质是 **应用形态与分发模型**。

## Capability mapping

- coverage 域：A2. 应用程序包 (HAP / HAR / HSP)
- 关联文件：`app-model.md`（Stage Model），`publishing.md`（上架）

## Official documentation entry points

- 应用程序包基础概念：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/hap-package-V5
- HAR（静态共享包）：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/har-package-V5
- HSP（动态共享包）：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/in-app-hsp-V5
- 多 HAP 开发：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/multi-hap-objective-V5
- module.json5 配置文件：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/module-configuration-file-V5
- 应用包结构：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/application-package-structure-stage-V5

## Concept model

HarmonyOS 应用包模型有 3 种基本单元：

| 单元 | 全称 | 性质 | 是否可独立运行 | 典型用途 |
|------|------|------|--------------|---------|
| HAP | Harmony Ability Package | 包含 UIAbility / ExtensionAbility | ✅ 可独立运行 | 主入口 / 功能模块 |
| HAR | Harmony Archive | 静态共享包 | ❌ 必须被引用 | 公共代码、UI 组件库 |
| HSP | Harmony Shared Package | 动态共享包 | ❌ 运行时加载 | 跨 HAP 复用、按需加载 |

一个应用 = 1 个 entry HAP + 0~N 个 feature HAP + 0~N 个 HAR + 0~N 个 HSP。

### 关键差异：HAR vs HSP

| 维度 | HAR | HSP |
|------|-----|-----|
| 编译模式 | 静态编译进 HAP | 独立编译，运行时加载 |
| 包体积 | 每个引用方各保留一份 | 多 HAP 共享一份 |
| 资源 | 复制到引用方 | 独立存在 |
| 适合 | 工具类、设计 token、小型组件 | 大型功能模块、跨 HAP 复用 |
| 风险 | 多次复制造成包体积膨胀 | 运行时依赖，发版必须同步 |

### Entry HAP vs Feature HAP

- Entry HAP：应用的主入口，每个设备类型有且仅有 1 个
- Feature HAP：可选的功能模块，按 deviceType / 资源标签按需安装

## Decision tree

需要做包结构决策时，按以下顺序判断：

```
1. 项目是不是只有 1 个团队 / 1 个 module？
   ├─ 是 → 不需要拆，单 entry HAP 即可
   └─ 否 → 进入 2

2. 公共部分有多少代码量 / 资源？
   ├─ 较小（< 5MB） → 用 HAR
   └─ 较大或多 HAP 共用 → 用 HSP

3. 功能模块需不需要按需安装 / 不同设备类型差异化？
   ├─ 需要 → 拆出 Feature HAP
   └─ 不需要 → 留在 entry HAP

4. 需不需要跨应用共享代码？
   ├─ 同发布者多应用 → 集成态 HSP（in-app HSP）
   └─ 一般情况下 → in-app HSP 已足够
```

## Implementation patterns

### Pattern 1: 单 module → 引入第一个 HAR

DevEco Studio 操作流程：
1. 右键项目 → New → Module → 选择 Static Library
2. 模板会创建一个 `library/` 目录
3. 在 entry/oh-package.json5 添加依赖：

```json
{
  "dependencies": {
    "@app/library": "file:../library"
  }
}
```

4. 在代码中引用：

```typescript
import { SharedButton } from '@app/library';
```

### Pattern 2: HAR 模块的对外 API 边界

`library/Index.ets` 是 HAR 的导出入口，**只暴露对外 API**：

```typescript
// library/Index.ets
export { SharedButton } from './src/main/ets/components/SharedButton';
export { ColorTokens } from './src/main/ets/theme/ColorTokens';
export type { ButtonConfig } from './src/main/ets/types/ButtonConfig';

// 内部实现不导出
// ❌ 不要把 src/main/ets/internal/* 暴露出去
```

### Pattern 3: HSP 的运行时引用

```typescript
// 引用方 HAP/oh-package.json5
{
  "dependencies": {
    "@app/sharedFeature": "file:../sharedFeature"
  }
}

// 代码引用与 HAR 一致
import { FeatureService } from '@app/sharedFeature';

// 注意：HSP 运行时加载，必须保证主 HAP 与 HSP 版本同步发布
```

### Pattern 4: Feature HAP 配置（按 deviceType 分发）

```json
// feature/src/main/module.json5
{
  "module": {
    "name": "tabletFeature",
    "type": "feature",
    "deviceTypes": ["tablet"],
    "abilities": [
      {
        "name": "TabletEntryAbility",
        "srcEntry": "./ets/entryability/TabletEntryAbility.ets"
      }
    ]
  }
}
```

### Pattern 5: 多 HAP 共享 HSP（避免重复打包）

```
project/
├── entry/        ← entry HAP (deviceType: phone)
├── tabletEntry/  ← entry HAP (deviceType: tablet)
├── commonHsp/    ← 共享 HSP（被两边引用，最终设备上只有 1 份）
└── library/      ← 工具类 HAR（编译时合并到引用方）
```

## Common pitfalls

### Pitfall 1: HAR 滥用导致包体积爆炸

**场景**：把大型 UI 组件库做成 HAR，结果每个 HAP 都包含一份 → APK 体积翻倍。

**对策**：超过 1MB 或多 HAP 共用的，应使用 HSP 而不是 HAR。

### Pitfall 2: HSP 版本错位

**场景**：主 HAP 升级了，HSP 没升级 → 运行时类型不匹配崩溃。

**对策**：发版时把所有 HAP + HSP 一起打包发布；不要分开热更新。

### Pitfall 3: Feature HAP 与 entry HAP 包名冲突

**场景**：每个 module 的 `module.json5` 中 `name` 必须**全局唯一**。

```json
// ❌ 错误：两个模块都叫 "entry"
// ✅ 正确：phoneEntry、tabletEntry
```

### Pitfall 4: HAR 的资源访问

HAR 中的资源在编译时合并到引用方，所以引用资源时**用引用方的资源 id**，而不是原 HAR 的：

```typescript
// 在 HAR 中定义了 string.json 中的 hello_text
// HAR 内部使用：
$r('app.string.hello_text')  // ✅ 正常
// 引用方 HAP 中使用同样写法
$r('app.string.hello_text')  // ✅ 正常（编译时已合并）
```

### Pitfall 5: in-app HSP 跨应用使用错误

**场景**：把 in-app HSP（集成态）当跨应用 HSP 用 → 发布失败。

**说明**：HarmonyOS HSP 主要支持 **in-app**（同应用内 HAP 共享），跨应用 HSP 形态有更严格的发布与认证流程。MVP 阶段优先 in-app HSP。

## Verification before commit

提交前必查：
- [ ] 每个 module 的 `module.json5` 中 `name` 全局唯一
- [ ] HAR 的 `Index.ets` 只暴露必要 API
- [ ] 大型共享代码用 HSP 而非 HAR
- [ ] entry HAP 与 HSP 版本号同步
- [ ] 多 HAP 部署目标（deviceTypes）无遗漏

## When to escalate to official docs

以下场景必须查官方文档：
- 自定义 `pack.info` / `module.json5` 高阶字段
- HSP 跨应用发布（需要发布者签名认证）
- AppGallery 多 HAP 上架配置
- 包大小优化、依赖混淆

参考 `official-search-playbook.md` 完成精确检索。
