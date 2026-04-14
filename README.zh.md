# harmony-app-dev

[English version / 英文版本](./README.md)

面向 AI agent 的 HarmonyOS / ArkUI 开发 skill。

## 这个 skill 做什么

这个 skill 的目标是帮助 AI 在做 HarmonyOS 功能实现时更可靠地工作，重点包括：
- 先把需求归类到正确的 Harmony 能力域
- 优先读取正确的本地参考资料
- 在 API 名称 / 方法签名必须精确时，指导 AI 去官方文档核对
- 在 MVP 场景下提供可落地的降级实现策略

需要强调的是：HarmonyOS 官方文档始终是精确 API 的最终依据。这个 skill 的价值在于帮助 AI 做能力判断、检索导航和实现策略选择，而不是替代官方 API Reference。

## 适用场景

- HarmonyOS 应用开发
- ArkUI 页面与组件实现
- 视觉效果、动画、手势、Canvas Demo
- Widget 与应用模型相关实现指导
- 减少 AI 臆造 Harmony API 的情况

## 语言支持

这个仓库在适合的地方维护独立的英文和中文文档。

当前规则：
- `README.md` 为英文版
- `README.zh.md` 为中文版
- 两个版本之间保持互相跳转
- 涉及精确 API 校验时，官方 API 名称保持原始命名

## 目录结构

```text
SKILL.md
references/
├── capability-map.md
├── api-watch.md
├── ui-implementation-rules.md
├── graphics-3d.md
├── widget.md
├── app-model.md
├── official-search-playbook.md
├── example-cookbook.md
└── official-api-examples.md
```

## 说明

- `SKILL.md` 是 agent 使用的 skill 入口文件
- `references/` 存放按需加载的领域参考资料
- 这个 skill 的目标是轻量、实用，不是做成完整的 HarmonyOS API 百科全书
