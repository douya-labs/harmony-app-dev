---
title: "Distributed"
description: "读这个文件当： - 需求出现「跨设备」「流转」「同账号同 wifi」「手机投屏到平板」 - 需要把任务从一台设备搬到另一台设备继续 - 多端共享数据（笔记、购物车、播放进度） - 涉及组网、设备发现、设备认证"
sidebar:
  order: 8
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/distributed.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/distributed.md)

HarmonyOS 分布式能力：跨设备协同、流转、分布式数据。

## Purpose

读这个文件当：
- 需求出现「跨设备」「流转」「同账号同 wifi」「手机投屏到平板」
- 需要把任务从一台设备搬到另一台设备继续
- 多端共享数据（笔记、购物车、播放进度）
- 涉及组网、设备发现、设备认证

⚠️ 分布式是 HarmonyOS 的核心差异化能力，但 **MVP 应用通常不需要**。先确认需求是否真的跨设备，否则用单机存储 + 云端同步可能更省。

## Capability mapping

- coverage 域：C10. 分布式 (Distributed Service Kit / 流转 / 分布式数据)
- 关联文件：`persistence.md`（分布式 KV 数据库的本地视角），`app-model.md`（流转的 UIAbility 入口）

## Official documentation entry points

- 设备间互联互通总览：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/inter-device-interaction-overview-V5
- 接续（Continuation）开发：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/hop-cross-device-migration-V5
- 跨设备拉起：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/hop-multi-device-collaboration-V5
- 分布式数据对象：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/distributedobject-guidelines-V5
- 分布式数据服务：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/distributeddataservice-overview-V5
- 设备管理（DeviceManager）：https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-distributedhardware-devicemanager-V5

## Concept model

分布式能力分 3 层：

```
表层：用户感知的体验
└── 流转 (handoff) / 协同 (multi-screen) / 投屏

中层：开发者编写的逻辑
├── 跨设备 UIAbility 拉起
├── 跨设备 ServiceExtension 调用
└── 分布式数据对象同步

底层：系统提供的基础设施
├── 分布式软总线（设备发现、认证、组网）
├── 分布式数据服务（KV / RDB）
└── 分布式安全（账号、设备级加密）
```

### 分布式触发条件

跨设备能力的成立前提（缺一不可）：
1. **同账号**：所有设备登录同一个华为账号
2. **同网络**：在同一 WLAN / 蓝牙距离内
3. **可发现**：设备开启「跨设备协同」开关
4. **应用授权**：用户授权分布式能力

⚠️ 这意味着：跨设备功能在企业内网、模拟器、单机调试场景下**经常无法触发**，需要真实多设备环境验证。

## Decision tree

```
需求是否需要跨设备？
├─ 否 → 用本地 + 云端方案（比分布式简单）
└─ 是 → 进入 2

场景是哪种？
├─ 任务接续（手机看视频→平板继续）→ Continuation API
├─ 协同操作（手机控制平板）→ 跨设备拉起 UIAbility
├─ 数据共享（购物车多端同步）→ 分布式数据对象
└─ 设备发现 → DeviceManager API
```

## Implementation patterns

### Pattern 1: 任务接续（Handoff）的 UIAbility 配置

```json
// module.json5
{
  "abilities": [{
    "name": "EntryAbility",
    "continuable": true,  // 关键：标记可接续
    ...
  }]
}
```

```typescript
// EntryAbility.ets
import UIAbility from '@ohos.app.ability.UIAbility';
import AbilityConstant from '@ohos.app.ability.AbilityConstant';

export default class EntryAbility extends UIAbility {
  // 源端：用户在 A 设备触发流转时调用
  onContinue(wantParam: Record<string, Object>): AbilityConstant.OnContinueResult {
    wantParam['videoId'] = this.context.videoId;
    wantParam['progress'] = this.context.currentProgress;
    return AbilityConstant.OnContinueResult.AGREE;
  }

  // 目标端：B 设备接续后启动时
  onCreate(want, launchParam) {
    if (launchParam.launchReason === AbilityConstant.LaunchReason.CONTINUATION) {
      const videoId = want.parameters?.videoId;
      const progress = want.parameters?.progress;
      // 恢复播放
    }
  }
}
```

### Pattern 2: 主动拉起对端设备的 UIAbility

```typescript
import common from '@ohos.app.ability.common';

async function launchOnRemoteDevice(deviceId: string) {
  const want: Want = {
    deviceId: deviceId,                          // 目标设备 ID
    bundleName: 'com.example.myapp',
    abilityName: 'EntryAbility',
    parameters: { mode: 'remote-control' }
  };

  await context.startAbility(want);
}
```

### Pattern 3: 设备发现

```typescript
import distributedDeviceManager from '@ohos.distributedDeviceManager';

const dmInstance = distributedDeviceManager.createDeviceManager('com.example.myapp');

// 获取已认证的可信设备列表
const trustedDevices = dmInstance.getAvailableDeviceListSync();
trustedDevices.forEach((device) => {
  console.info(`device: ${device.deviceName}, id: ${device.networkId}`);
});

// 监听设备上下线
dmInstance.on('deviceStateChange', (data) => {
  console.info(`state: ${data.action}, device: ${data.device.deviceName}`);
});
```

### Pattern 4: 分布式数据对象（多端实时同步）

```typescript
import distributedDataObject from '@ohos.data.distributedDataObject';

interface ShoppingCart {
  items: string[];
  total: number;
}

const cart: ShoppingCart = { items: [], total: 0 };

const dataObject = distributedDataObject.create(this.context, cart);

// 设置 sessionId 后，所有同 sessionId 的设备开始同步
dataObject.setSessionId('shopping-cart-session-001');

// 监听变化
dataObject.on('change', (sessionId, fields) => {
  console.info(`changed fields: ${JSON.stringify(fields)}`);
  // 更新 UI
});

// 修改即同步
dataObject.items = [...dataObject.items, 'product-123'];
```

### Pattern 5: 流转 UI 提示

DevEco Studio 模板已经处理「设备列表选择 UI」，开发者通常不需要自己写设备选择界面；但需要：
- 在 `module.json5` 配置 `continuable: true`
- 在 `onContinue` 中正确填充 wantParam
- 在 `onCreate` 中识别接续启动

## Common pitfalls

### Pitfall 1: 单设备调试看不到效果

**现象**：模拟器或单设备运行，分布式 API 返回空数组 / 失败。

**对策**：
- 必须 2 台真机 + 同账号 + 同 wifi + 开启跨设备开关
- 调试日志看 HiLog 中 `DistributedSched` / `DistributedHardware` 模块

### Pitfall 2: 没声明 continuable 但调用 onContinue

`module.json5` 必须显式 `continuable: true`，否则 onContinue 永远不被调用。

### Pitfall 3: 流转参数过大

`wantParam` 有大小限制（约 200KB）。大文件 / 大对象不能直接传，应：
- 上传到云 / 公共存储
- 在 wantParam 中只传引用 ID
- 目标端拉取

### Pitfall 4: 分布式数据对象的 sessionId 必须一致

两端的 `setSessionId('xxx')` 必须用**相同字符串**，否则不同步。

### Pitfall 5: 用户没授权分布式能力

第一次使用时弹出系统授权弹窗，用户拒绝后**永久禁用**直到设置中重新打开。文案要清晰说明用途。

## Verification before commit

提交前必查：
- [ ] 跨设备入口都做了「设备未连接」的 fallback
- [ ] wantParam 大小 < 100KB
- [ ] 分布式数据对象的 sessionId 在常量里集中管理
- [ ] 文档说明了「需要 2 台同账号设备测试」

## When to escalate to official docs

- 分布式硬件能力（摄像头、麦克风跨设备调用）→ DistributedHardware 文档
- 分布式安全（设备级加密、跨设备权限）→ AccessToken + DistributedSecurity
- 与传统云端 sync（推送/拉取）的对比选型

参考 `official-search-playbook.md`。
