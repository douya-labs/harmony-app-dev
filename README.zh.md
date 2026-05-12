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
├── coverage.md
├── capability-map.md
├── api-watch.md
├── official-search-playbook.md
├── official-api-examples.md
├── app-model.md
├── ui-implementation-rules.md
├── visual-effects-recipes.md
├── example-cookbook.md
├── component-library-policy.md
├── graphics-3d.md
├── widget.md
├── widget-cookbook.md
├── state-management.md
├── animation-and-gesture.md
├── canvas.md
├── permissions.md
├── network.md
├── persistence.md
├── file-management.md
├── media-and-camera.md
├── notification.md
├── location.md
├── concurrency.md
├── background-tasks.md
├── security-and-privacy.md
├── debugging.md
├── publishing.md
├── packaging.md
├── distributed.md
├── atomic-service.md
├── arkts-language.md
├── resource-management.md
├── i18n.md
├── accessibility.md
├── cross-device.md
└── ui-design.md
```

## 说明

- `SKILL.md` 是 agent 使用的 skill 入口文件
- `references/` 存放按需加载的领域参考资料
- 这个 skill 的目标是轻量、实用，不是做成完整的 HarmonyOS API 百科全书

## 公开 Web 镜像 —— `web/`

基于同一份 `references/` 内容做的一个面向 SEO 的公开开发者资源站，放在 [`web/`](./web)。线上地址 **https://ohosdev.com**。

```bash
cd web
npm install
npm run sync:refs   # 从 ../references 重新同步 /docs
npm run dev         # http://localhost:4321
npm run build       # 产物在 ./dist（纯静态，Cloudflare Pages 友好）
```

详见 [`web/README.md`](./web/README.md)：技术栈、AdSense 配置、Cloudflare Pages 接入步骤。

站点分两层内容：

- **`/docs/`** —— `references/` 的 38 篇参考文档，自动同步后以文档站形式呈现（英文 + 中文翻译待补）。
- **`/tutorials/`** —— 在 references 之上写的长文教程，主要做 SEO 和可读性。
