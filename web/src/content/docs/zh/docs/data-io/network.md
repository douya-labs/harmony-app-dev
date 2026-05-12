---
title: "Network"
description: "Use this file when a HarmonyOS task involves any of:"
sidebar:
  order: 3
---

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/network.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/network.md)

## Purpose

Use this file when a HarmonyOS task involves any of:

- making HTTP / HTTPS requests to a backend or third-party API
- uploading files (images, audio, documents)
- downloading resources (images, files, updates)
- monitoring network connection state (wifi / cellular / offline)
- handling timeouts, retries, and offline fallback
- choosing between high-level and low-level network APIs

This file is the **engineering playbook** for network in HarmonyOS apps.
It does not replace official docs; for exact request configuration and the latest socket APIs, always verify against the official references below.

## Capability mapping

This file maps to coverage matrix row **C2. Network**.

## Official documentation entry points

- Network Kit overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/network-management-overview-V5
- HTTP data request guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/http-request-V5
- @ohos.net.http API reference: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-http-V5
- @ohos.net.connection (network state) API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-net-connection-V5
- Upload and download (request kit): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/upload-request-V5
- @ohos.request API reference: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-request-V5
- Permission `ohos.permission.INTERNET`: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/permission-list-V5

> The exact module name, method signature, and option keys may differ across SDK versions. Always confirm against the targeted SDK's reference page.

## Concept model

A HarmonyOS network task has three layers an agent should distinguish before coding:

### 1. Transport layer choice

- **`@ohos.net.http`** — high-level HTTP/HTTPS client; default choice for REST APIs and JSON
- **`@ohos.request`** — long-running upload/download with system-managed task lifecycle; use for files
- **`@ohos.net.socket` / `webSocket`** — low-level TCP/UDP/WebSocket; use only when streaming or persistent connections are required

For most app feature work, **`@ohos.net.http`** is the right starting point.

### 2. Connection awareness layer

- **`@ohos.net.connection`** — query current network state, register listeners
- use this to gate expensive operations on metered networks
- use this to short-circuit requests when offline rather than letting them time out

### 3. Permission layer

- `ohos.permission.INTERNET` — required for any network access; declare in `module.json5`
- this is `system_grant`; declaration alone is sufficient, no runtime prompt
- omitting it causes silent failures in `http.request`

## Decision tree

```text
Need to talk to network?
   │
   ├── single request, JSON / small payload
   │     → @ohos.net.http
   │
   ├── upload / download a file (image, audio, blob)
   │     → @ohos.request (background-friendly, resumable)
   │
   ├── persistent bi-directional channel
   │     → webSocket
   │
   └── raw TCP / UDP
         → @ohos.net.socket
```

Then for any of the above:

```text
1. Declare ohos.permission.INTERNET in module.json5
2. Wrap in a typed client (do not scatter raw http.request calls)
3. Add timeout
4. Add retry policy with backoff for idempotent requests only
5. Check network state before retry on offline
6. Log via HiLog for debugging, not console-only
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Declare network permission

```json5
{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.INTERNET" },
      { "name": "ohos.permission.GET_NETWORK_INFO" }
    ]
  }
}
```

`GET_NETWORK_INFO` is needed if the app reads connection type / state.

### Pattern 2 — Minimal HTTP GET

```ts
import http from '@ohos.net.http'

export async function fetchJson<T>(url: string): Promise<T> {
  const httpRequest = http.createHttp()
  try {
    const response = await httpRequest.request(url, {
      method: http.RequestMethod.GET,
      header: { 'Content-Type': 'application/json' },
      readTimeout: 10_000,
      connectTimeout: 5_000
    })
    if (response.responseCode !== 200) {
      throw new Error(`HTTP ${response.responseCode}`)
    }
    return JSON.parse(response.result as string) as T
  } finally {
    httpRequest.destroy()
  }
}
```

Notes:

- always `destroy()` the request handle in `finally` to release native resources
- `response.result` may be `string | ArrayBuffer | Object`; coerce explicitly
- timeouts are in milliseconds

### Pattern 3 — Typed HTTP client wrapper

```ts
import http from '@ohos.net.http'

export interface HttpClientOptions {
  baseUrl: string
  defaultHeaders?: Record<string, string>
  connectTimeoutMs?: number
  readTimeoutMs?: number
}

export class HttpClient {
  constructor(private opts: HttpClientOptions) {}

  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, headers)
  }

  async post<T>(path: string, body: object, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', path, body, headers)
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: object,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.opts.baseUrl.replace(/\/$/, '') + path
    const httpRequest = http.createHttp()
    try {
      const response = await httpRequest.request(url, {
        method: method as http.RequestMethod,
        header: {
          'Content-Type': 'application/json',
          ...this.opts.defaultHeaders,
          ...headers
        },
        extraData: body !== undefined ? JSON.stringify(body) : undefined,
        connectTimeout: this.opts.connectTimeoutMs ?? 5_000,
        readTimeout: this.opts.readTimeoutMs ?? 10_000
      })
      if (response.responseCode < 200 || response.responseCode >= 300) {
        throw new HttpError(response.responseCode, response.result as string)
      }
      return JSON.parse(response.result as string) as T
    } finally {
      httpRequest.destroy()
    }
  }
}

export class HttpError extends Error {
  constructor(public code: number, public body: string) {
    super(`HTTP ${code}`)
  }
}
```

Centralizing the client unlocks: shared base URL, shared headers, single timeout policy, single error shape, single place to add tracing.

### Pattern 4 — Upload a file via @ohos.request

```ts
import request from '@ohos.request'
import common from '@ohos.app.ability.common'

export async function uploadPhoto(
  context: common.UIAbilityContext,
  fileUri: string,
  uploadUrl: string,
  authToken: string
): Promise<void> {
  const config: request.UploadConfig = {
    url: uploadUrl,
    header: { Authorization: `Bearer ${authToken}` },
    method: 'POST',
    files: [
      {
        filename: 'photo.jpg',
        name: 'file',
        uri: fileUri,
        type: 'image/jpeg'
      }
    ],
    data: []
  }
  const task = await request.uploadFile(context, config)
  return new Promise((resolve, reject) => {
    task.on('complete', () => resolve())
    task.on('fail', (states) => reject(new Error(`upload failed: ${JSON.stringify(states)}`)))
  })
}
```

### Pattern 5 — Network state awareness

```ts
import connection from '@ohos.net.connection'

export type NetType = 'wifi' | 'cellular' | 'ethernet' | 'none'

export async function currentNetType(): Promise<NetType> {
  try {
    const handle = await connection.getDefaultNet()
    const cap = await connection.getNetCapabilities(handle)
    const bearers = cap.bearerTypes ?? []
    if (bearers.includes(connection.NetBearType.BEARER_WIFI)) return 'wifi'
    if (bearers.includes(connection.NetBearType.BEARER_CELLULAR)) return 'cellular'
    if (bearers.includes(connection.NetBearType.BEARER_ETHERNET)) return 'ethernet'
    return 'none'
  } catch {
    return 'none'
  }
}

export function watchNetChanges(onChange: (online: boolean) => void): () => void {
  const netConn = connection.createNetConnection()
  netConn.on('netAvailable', () => onChange(true))
  netConn.on('netLost', () => onChange(false))
  netConn.register((err) => {
    if (err) console.error(`[net] register failed: ${err.message}`)
  })
  return () => netConn.unregister(() => {})
}
```

### Pattern 6 — Retry with exponential backoff (idempotent only)

```ts
export async function retry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseMs?: number } = {}
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3
  const baseMs = opts.baseMs ?? 500
  let lastErr: unknown
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const delay = baseMs * Math.pow(2, i) + Math.floor(Math.random() * 200)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}
```

Use **only for idempotent operations** (GET, idempotent PUT). Never auto-retry POST that creates a resource.

## Common pitfalls

### Forgetting `ohos.permission.INTERNET`
Without this declaration, `http.request` fails silently or throws an unclear error. Add it as the first step of any networking work.

### Not destroying the http handle
`http.createHttp()` allocates native resources. Forgetting `httpRequest.destroy()` leaks handles and degrades long-running apps. Always wrap in `try/finally`.

### Coercing response body wrongly
`response.result` can be `string`, `ArrayBuffer`, or `Object` depending on `expectDataType`. Either set `expectDataType` explicitly or coerce defensively before `JSON.parse`.

### Tight retry loops on POST
Auto-retrying a non-idempotent POST may create duplicates server-side. Mark each request with an idempotency strategy before adding retries.

### Misusing connect vs read timeout
`connectTimeout` covers TCP handshake; `readTimeout` covers waiting for data. Setting only one leaves an unbounded path. Set both.

### Treating offline as failure
On flaky networks, `http.request` may surface generic errors. Always check `connection.getDefaultNet` first or before retrying, and present "offline" UX rather than retry-spam.

### Hardcoding URLs across files
Spreading raw URL strings makes environment switching painful. Centralize through a typed `HttpClient` with `baseUrl`.

### Missing HTTPS for sensitive endpoints
HarmonyOS may enforce HTTPS by default for some categories; relying on plain HTTP requires extra configuration and review consideration. Default to HTTPS.

### Logging response bodies that contain tokens
HiLog output may be readable in some debugging contexts. Never log full headers or bodies that include auth tokens or PII.

## Verification checklist (before shipping a network feature)

1. `ohos.permission.INTERNET` declared in `module.json5`
2. all requests go through a centralized `HttpClient` (or equivalent)
3. timeouts set explicitly (`connectTimeout` + `readTimeout`)
4. error path returns typed error, not raw string
5. retries only on idempotent operations
6. offline state checked before retry
7. handles released (`destroy()` for http, task lifecycle for request)
8. no auth tokens in logs
9. uses HTTPS for any sensitive endpoint
10. uploads use `@ohos.request`, not raw http multipart, when feasible

## Fallback strategies when blocked

### When the SDK module name differs in target version
- check Release Notes for `@ohos.net.http` vs newer namespaces
- isolate networking behind the `HttpClient` so the underlying module can be swapped without touching call sites

### When upload via `@ohos.request` is unavailable
- fall back to `http.request` with manually constructed `multipart/form-data`
- accept the loss of background continuation as a known limitation

### When network is fully unavailable
- queue requests in local persistence (see `persistence.md`)
- show offline indicator
- replay queued requests on `netAvailable` event

## Output expectations

When generating implementation that touches network, the agent should:

- declare `ohos.permission.INTERNET` (and `GET_NETWORK_INFO` when applicable)
- prefer a typed `HttpClient` over scattered `http.request` calls
- set both `connectTimeout` and `readTimeout`
- handle non-2xx as errors explicitly
- mention HiLog for diagnostics, not `console.log`
- note when exact API names still need official verification for the targeted SDK
