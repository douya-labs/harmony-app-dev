# harmony-app-dev

HarmonyOS / ArkUI development skill for AI agents.  
面向 AI agent 的 HarmonyOS / ArkUI 开发 skill。

## What it does / 作用

This skill helps an AI agent implement HarmonyOS features more reliably by:
- classifying the requirement into the correct Harmony capability domain
- pointing to the right local references first
- guiding official API lookup when exact names/signatures matter
- providing practical fallback strategies for MVP implementation

这个 skill 的目标是帮助 AI 在做 HarmonyOS 功能实现时更可靠地工作，重点包括：
- 先把需求归类到正确的 Harmony 能力域
- 优先读取正确的本地参考资料
- 在 API 名称 / 方法签名必须精确时，指导 AI 去官方文档核对
- 在 MVP 场景下提供可落地的降级实现策略

## Best for / 适用场景

- HarmonyOS app development
- ArkUI page and component implementation
- visual effects, animations, gestures, Canvas demos
- Widget and app-model related implementation guidance
- reducing hallucinated Harmony APIs

适合：
- HarmonyOS 应用开发
- ArkUI 页面与组件实现
- 视觉效果、动画、手势、Canvas Demo
- Widget 与应用模型相关实现指导
- 减少 AI 臆造 Harmony API 的情况

## Language Support / 语言支持

This skill is designed to support both **English and Chinese** task descriptions and references.  
这个 skill 默认支持 **英文与中文** 两种任务描述和参考信息。

Preferred behavior:
- keep trigger descriptions understandable in both English and Chinese
- allow references and implementation notes to contain Chinese, English, or mixed terminology when that improves clarity
- prefer official API names in their original form when exact verification matters

默认约定：
- 触发描述尽量同时兼顾英文和中文可理解性
- 参考资料和实现说明可以使用中文、英文或中英混合术语，只要更清楚即可
- 涉及精确 API 校验时，优先保留官方 API 原始命名

## Structure / 目录结构

```text
SKILL.md
references/
├── capability-map.md
├── api-watch.md
├── ui-implementation-rules.md
├── graphics-3d.md
├── widget.md
├── app-model.md
└── official-search-playbook.md
```

## Notes / 说明

- `SKILL.md` is the entrypoint used by the agent  
  `SKILL.md` 是 agent 使用的入口文件
- `references/` contains focused domain references loaded as needed  
  `references/` 存放按需加载的领域参考资料
- The skill is designed to be lightweight and practical, not a full HarmonyOS API encyclopedia  
  这个 skill 的目标是轻量、实用，不是做成一套完整的 HarmonyOS API 百科全书
