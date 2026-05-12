---
title: "ArkTS Language"
description: "读这个文件当： - 写 ArkTS 时遇到「TypeScript 能写但 ArkTS 不能写」的报错 - 不确定 ArkTS 与 TypeScript / JavaScript 的差异 - 类型系统报错 `ArkTS suggests using stricter type system` - 想用动态特性（eval / Object.assign / any）但被编辑器警告 - 性能优化（…"
sidebar:
  order: 12
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/arkts-language.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/arkts-language.md)

ArkTS 语言能力：基于 TypeScript 的鸿蒙 UI 语言，关键差异点 + 类型系统 + 装饰器。

## Purpose

读这个文件当：
- 写 ArkTS 时遇到「TypeScript 能写但 ArkTS 不能写」的报错
- 不确定 ArkTS 与 TypeScript / JavaScript 的差异
- 类型系统报错 `ArkTS suggests using stricter type system`
- 想用动态特性（eval / Object.assign / any）但被编辑器警告
- 性能优化（编译时严格 vs 运行时动态）

⚠️ ArkTS ≠ TypeScript。ArkTS 是 TS 的**严格子集 + 鸿蒙特有装饰器**。很多 TS 习惯写法在 ArkTS 里被禁用。

## Capability mapping

- coverage 域：A4. ArkTS 语言 (Language)
- 关联文件：`state-management.md`（@State 等装饰器），`ui-implementation-rules.md`（组件写法）

## Official documentation entry points

- ArkTS 语言介绍：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-overview-V5
- 从 TypeScript 到 ArkTS 适配规则：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/typescript-to-arkts-migration-guide-V5
- ArkTS 基础语法：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-basic-syntax-overview-V5
- 装饰器总览：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-state-V5
- 编程规范：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/programming-style-guide-V5

## Concept model

### ArkTS = TypeScript 严格子集 + 鸿蒙装饰器

```
TypeScript 全集
└── 子集：ArkTS（移除动态特性）
    └── 加上：鸿蒙装饰器系统（@Component / @State / @Builder ...）
```

### 为什么禁用动态特性？

ArkTS 编译器需要在编译期完成类型推断与组件状态分析，从而：
- AOT 编译（无 JIT）→ 启动快、性能稳定
- 状态依赖图静态可分析 → UI 更新精准
- 类型安全 → 减少运行时崩溃

代价就是：动态特性几乎全部禁用。

### 关键禁用 vs 推荐

| TypeScript 习惯 | ArkTS 是否允许 | 替代方案 |
|---------------|--------------|---------|
| `any` 类型 | ❌ 禁用 | 使用具体类型或 `Object` |
| 类型断言 `as` | ⚠️ 受限 | 用类型守卫 |
| 索引签名 `[key: string]` | ❌ 禁用 | 用 Record<K,V> 或 Map |
| 运行时 `Object.assign(obj, src)` | ❌ 禁用 | 显式逐字段赋值 |
| 函数参数解构 | ❌ 禁用 | 显式属性访问 |
| 字符串模板做对象 key | ⚠️ 受限 | 编译时常量 |
| `eval` / `Function()` | ❌ 禁用 | 重新设计 |
| `prototype` 修改 | ❌ 禁用 | 用 class extends |
| `delete obj.field` | ❌ 禁用 | 字段设为 undefined |

## Decision tree

```
报错 "object literal must correspond to some explicitly declared..."
└→ 加显式类型注解：`const x: MyType = { ... }`

报错 "indexed access is not allowed for fields"
└→ 用 Record<string, T> 或 Map<K, V>

报错 "use explicit types instead of any"
└→ 不能用 any；用具体类型 / Object（ESObject 已不推荐）

需要动态字段？
└→ 用 Map<string, ValueType>，不要用 plain object

要在运行时拼对象？
└→ 用类构造函数显式初始化所有字段
```

## Implementation patterns

### Pattern 1: 类型显式声明

```typescript
// ❌ TypeScript 风格（ArkTS 不接受）
const user = { name: 'Alice', age: 30 };

// ✅ ArkTS 风格
class User {
  name: string = '';
  age: number = 0;
}
const user: User = { name: 'Alice', age: 30 };

// 或 interface
interface UserInfo {
  name: string;
  age: number;
}
const user: UserInfo = { name: 'Alice', age: 30 };
```

### Pattern 2: 替代 any

```typescript
// ❌
function handle(data: any) { ... }

// ✅ 用具体联合类型
function handle(data: string | number | UserInfo) { ... }

// ✅ 实在不知道类型时用 Object（基类）
function handle(data: Object) {
  if (typeof data === 'string') { ... }
}
```

### Pattern 3: 替代索引签名

```typescript
// ❌
interface Config {
  [key: string]: string;
}

// ✅ 用 Record
type Config = Record<string, string>;
const cfg: Config = { theme: 'dark', lang: 'zh' };

// ✅ 或用 Map（更适合频繁增删 key 的场景）
const cfg = new Map<string, string>();
cfg.set('theme', 'dark');
```

### Pattern 4: 替代解构赋值（在函数参数里）

```typescript
// ❌
function login({ name, password }: LoginPayload) { ... }

// ✅
function login(payload: LoginPayload) {
  const name = payload.name;
  const password = payload.password;
  ...
}
```

### Pattern 5: 类用法

```typescript
class HttpClient {
  private baseURL: string;
  private timeout: number = 5000;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(path: string): Promise<T> {
    // ...
  }
}

// 使用
const client = new HttpClient('https://api.example.com');
const data = await client.get<UserInfo>('/user/me');
```

### Pattern 6: 鸿蒙装饰器骨架

```typescript
@Component
struct MyComponent {
  // 状态：私有响应式
  @State message: string = 'Hello';

  // 父子双向绑定
  @Link totalCount: number;

  // 父→子单向
  @Prop subtitle: string = '';

  // 跨组件树（祖先→后代）
  @Provide('theme') currentTheme: string = 'dark';
  @Consume('theme') theme: string;

  // 应用级
  // @StorageProp('userId') userId: string = '';
  // @StorageLink('cartItems') cartItems: number = 0;

  // 持久化（应用重启后恢复）
  // @Persistent('settings') settings: Settings = new Settings();

  build() {
    Text(this.message)
  }

  // 自定义构建函数
  @Builder MySection() {
    Text('section')
  }
}

// 入口装饰器
@Entry
@Component
struct PageRoot {
  build() { ... }
}
```

### Pattern 7: 联合类型与判别

```typescript
type LoginResult = { success: true; token: string } | { success: false; error: string };

function handleResult(r: LoginResult) {
  if (r.success) {
    console.info(r.token);  // ts 推断 token: string
  } else {
    console.info(r.error);  // ts 推断 error: string
  }
}
```

### Pattern 8: 异步与 Promise

```typescript
// 异步函数
async function fetchUser(id: string): Promise<UserInfo> {
  const response = await httpClient.get<UserInfo>(`/users/${id}`);
  return response;
}

// 顶层调用
async function main() {
  try {
    const user = await fetchUser('u123');
    console.info(user.name);
  } catch (e) {
    console.error('failed', e);
  }
}
```

## Common pitfalls

### Pitfall 1: 复制粘贴 TypeScript 代码后报错一片

很多 React / TS 项目代码到 ArkTS 不能直接用：
- 解构 → 重写
- any → 加类型
- 对象索引 → 用 Map / Record
- Object.assign → 显式赋值

**最佳实践**：把 TS 代码片段当「伪代码参考」，按 ArkTS 语法重写一遍。

### Pitfall 2: undefined / null 不可互换

ArkTS 区分 `undefined` 和 `null`。声明类型为 `string | undefined` 时不能赋 `null`。

```typescript
// ❌ 类型不匹配
let name: string | undefined = null;

// ✅
let name: string | undefined = undefined;
let name: string | null = null;
```

### Pitfall 3: 类字段必须初始化

```typescript
// ❌
class User {
  name: string;  // 错：未初始化
}

// ✅
class User {
  name: string = '';  // 默认值
}

// ✅ 或在 constructor 中初始化（ArkTS 要求严格）
class User {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
```

### Pitfall 4: 误把 @State 用在普通 class

`@State` 等装饰器**只在 @Component / @ComponentV2 修饰的 struct 内有效**。普通 class 不能用 @State。

需要响应式数据：
- 数据本身用普通 class
- 持有它的字段在组件里用 @State

### Pitfall 5: 类型断言失效

```typescript
// ❌ ArkTS 类型断言受限
const x = unknownData as SomeClass;

// ✅ 用 instanceof / typeof 守卫
if (unknownData instanceof SomeClass) {
  // unknownData 此时类型已收窄
}
```

### Pitfall 6: 使用 ESObject 当万能容器

旧文档常推荐 `ESObject`，但已不再推荐。新代码应用：
- 具体的 class / interface
- 或 `Object`（基类）+ 类型守卫
- 或 `Record<string, T>`

## Verification before commit

- [ ] 没有 `any` 关键字
- [ ] 没有解构赋值（除非局部变量）
- [ ] 类字段都有默认值或 constructor 初始化
- [ ] DevEco Studio 中无红色 / 黄色警告
- [ ] 响应式状态都用 @State 等装饰器（不用普通字段）
- [ ] 跨文件类型显式 export

## When to escalate to official docs

- 复杂类型系统问题（条件类型、infer、模板字面量类型）
- 编译器优化提示（如 SendableObject、@Sendable）
- ArkTS 1.x 与 ArkTS 2.x 的能力差异
- 与 ts/js 模块互操作的限制

参考 `official-search-playbook.md` 与「TypeScript to ArkTS 适配指南」。
