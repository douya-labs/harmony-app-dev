---
title: "File Management"
description: "Use this file when a HarmonyOS task involves reading, writing, or organizing files: app sandbox files, user-visible documents, file pickers, file URIs."
sidebar:
  order: 2
---

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/file-management.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/file-management.md)

## Purpose

Use this file when a HarmonyOS task involves reading, writing, or organizing files: app sandbox files, user-visible documents, file pickers, file URIs.

Covers:

- the file sandbox layout (data dir, files dir, cache dir)
- reading and writing files via Core File Kit
- choosing between app-private storage, public file picker, and media library
- file URI shapes and how to pass them around safely
- atomic writes, temp files, and cleanup
- privacy and storage hygiene

This file is the **engineering playbook** for file management.
It does not replace official docs; verify exact module paths and access modes from the references below.

## Capability mapping

This file maps to coverage matrix row **C4. File management**.

## Official documentation entry points

- File management overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/file-management-overview-V5
- App file access (sandbox): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/app-file-access-V5
- @ohos.file.fs API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-file-fs-V5
- File picker (DocumentViewPicker): https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/documentviewpicker-V5
- @ohos.file.picker API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-file-picker-V5
- File URI handling: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/file-uri-V5
- Cache directory guidance: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/app-cache-V5

## Concept model

### Sandbox layout
Each app has a private sandbox with several roles:

- **filesDir** — durable app files; survives app updates
- **cacheDir** — disposable app files; system may clear under storage pressure
- **tempDir** — process-local temp files; cleared between sessions
- **databaseDir** — for app databases
- **distributedFilesDir** — for distributed file scenarios

Use the right role; storing durable user data in cache risks losing it.

### Three storage scopes
- **app private (sandbox)** — no permission, opaque to other apps
- **user documents (picker)** — user explicitly chooses; one-shot or scoped access
- **user media library** — gallery photos / videos; see `media-and-camera.md`

### URI shapes
- `file://` — sandbox file
- `dataability://` / `content://` — provider-backed shared files
- picker-returned URIs are typically opaque content URIs; do not try to parse

Always pass URIs around; do not synthesize raw filesystem paths from them.

### Encoding for path joining
- always use the path APIs of `@ohos.file.fs` or string-safe joining
- never concatenate paths with raw `+` ignoring trailing slashes; subtle bugs follow

## Decision tree

```text
Need to handle a file?
   │
   ├── app's own data, durable
   │     → filesDir (sandbox)
   │
   ├── app's own data, disposable
   │     → cacheDir
   │
   ├── user picks a document to import
   │     → DocumentViewPicker
   │     → copy into sandbox if needed beyond immediate use
   │
   ├── user picks a photo / video
   │     → PhotoViewPicker (see media-and-camera.md)
   │
   ├── exporting a file the app generated
   │     → write to sandbox first, then save-as via picker
   │
   └── sharing across devices
         → distributedFilesDir or distributed KV (see persistence.md)
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact API names against the targeted SDK before shipping.

### Pattern 1 — Resolve sandbox paths

```ts
import common from '@ohos.app.ability.common'

export interface AppPaths {
  filesDir: string
  cacheDir: string
  tempDir: string
  databaseDir: string
}

export function appPaths(context: common.UIAbilityContext): AppPaths {
  return {
    filesDir: context.filesDir,
    cacheDir: context.cacheDir,
    tempDir: context.tempDir,
    databaseDir: context.databaseDir
  }
}
```

Centralize path resolution; do not pepper raw `context.filesDir` references throughout the code.

### Pattern 2 — Write a small file atomically

```ts
import fs from '@ohos.file.fs'

export async function writeAtomic(targetPath: string, data: string): Promise<void> {
  const tmp = `${targetPath}.tmp`
  const file = await fs.open(tmp, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC)
  try {
    await fs.write(file.fd, data)
    await fs.fsync(file.fd)
  } finally {
    await fs.close(file.fd)
  }
  // rename is atomic on most filesystems
  await fs.rename(tmp, targetPath)
}
```

Atomic write avoids leaving a half-written file if the process dies mid-write.

### Pattern 3 — Read a file as text

```ts
export async function readText(path: string): Promise<string> {
  const file = await fs.open(path, fs.OpenMode.READ_ONLY)
  try {
    const stat = await fs.stat(path)
    const buf = new ArrayBuffer(stat.size)
    await fs.read(file.fd, buf)
    return new TextDecoder().decode(buf)
  } finally {
    await fs.close(file.fd)
  }
}
```

### Pattern 4 — Stream copy (for large files)

```ts
export async function copyStream(src: string, dst: string): Promise<void> {
  const inFd = (await fs.open(src, fs.OpenMode.READ_ONLY)).fd
  const outFd = (await fs.open(dst, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC)).fd
  const buf = new ArrayBuffer(64 * 1024)
  try {
    while (true) {
      const n = await fs.read(inFd, buf)
      if (n <= 0) break
      await fs.write(outFd, buf.slice(0, n))
    }
    await fs.fsync(outFd)
  } finally {
    await fs.close(inFd)
    await fs.close(outFd)
  }
}
```

For very large files, prefer streamed copy over loading the whole file into memory.

### Pattern 5 — DocumentViewPicker for user files

```ts
import picker from '@ohos.file.picker'

export async function pickDocument(): Promise<string | null> {
  const opts = new picker.DocumentSelectOptions()
  const dvp = new picker.DocumentViewPicker()
  const result = await dvp.select(opts)
  if (!result || result.length === 0) return null
  return result[0]
}
```

The returned URI grants on-the-fly access. Copy to sandbox if you need access beyond the immediate operation.

### Pattern 6 — Export "Save As"

```ts
export async function saveAs(generatedPath: string, suggestedName: string): Promise<string | null> {
  const opts = new picker.DocumentSaveOptions()
  opts.newFileNames = [suggestedName]
  const dvp = new picker.DocumentViewPicker()
  const targets = await dvp.save(opts)
  if (!targets || targets.length === 0) return null
  const targetUri = targets[0]
  await copyToUri(generatedPath, targetUri)
  return targetUri
}
```

(`copyToUri` is your wrapper; the exact API for writing into a picker-granted URI varies by SDK.)

### Pattern 7 — Cache hygiene

```ts
export async function trimCache(maxBytes: number, cacheDir: string): Promise<void> {
  const entries = await fs.listFile(cacheDir)
  const stats = await Promise.all(entries.map(async (name) => {
    const p = `${cacheDir}/${name}`
    const s = await fs.stat(p)
    return { p, mtime: s.mtime, size: s.size }
  }))
  stats.sort((a, b) => a.mtime - b.mtime)
  let total = stats.reduce((acc, e) => acc + e.size, 0)
  for (const e of stats) {
    if (total <= maxBytes) break
    await fs.unlink(e.p)
    total -= e.size
  }
}
```

A simple LRU eviction keeps cache bounded; run periodically or on app startup.

## Common pitfalls

### Storing user data in cacheDir
The system may evict cache files at any time. Anything the user expects to persist belongs in `filesDir`.

### Forgetting to close file descriptors
Each `fs.open` allocates an fd. Forgetting `fs.close` leaks fds and eventually crashes the app. Wrap in try/finally.

### Concatenating paths naively
`filesDir + 'records.json'` may produce `/data/...recordsRecords.json` when filesDir lacks a trailing slash and the developer adds another. Use safe joining.

### Treating picker URIs as filesystem paths
Picker URIs are opaque. Trying to read them with `fs.open(uri, ...)` may fail. Use the proper file picker / file abstraction APIs to read content.

### Writing to filesDir without atomic rename
A write that crashes mid-flight leaves a corrupt file. Use the temp + rename pattern.

### Loading huge files into memory
Reading a large file with `fs.read` of full size can OOM. Stream large files in chunks.

### Cache that grows unbounded
Without an eviction policy, cache can grow until the system evicts it noisily. Implement bounded cache.

### Mixing distributed and local paths
Files in `distributedFilesDir` follow distributed semantics (sync, conflicts). Putting non-distributed data there causes confusion.

### Failing to clean temp files
Temp files left after operations clutter `tempDir`. The system may eventually clean them, but app should treat temp lifetime as its own responsibility.

## Verification checklist (before shipping a file feature)

1. paths centralized through a small helper
2. file role chosen correctly (filesDir vs cacheDir vs tempDir vs distributed)
3. all `fs.open` paired with `fs.close`
4. atomic writes used for important state files
5. large files streamed, not fully loaded
6. cache has a bounded eviction policy
7. picker URIs treated as opaque
8. temp files cleaned up by the operation that created them
9. error paths surface user-visible messages, not silent failures
10. no PII written to disk in plaintext that should be encrypted (see security-and-privacy.md)

## Fallback strategies when blocked

### When the SDK file API differs in target version
- isolate file operations behind a small wrapper
- check Release Notes for module renames

### When picker integration is too costly for MVP
- import data via app sandbox first (manual entry, dev tool)
- add picker integration after MVP

### When storage pressure is reported
- aggressively trim cache
- offer "clear data" UX that wipes cache and non-critical files

### When file corruption is suspected
- log file size and integrity hash on read
- fall back to a re-fetch from network when local copy is invalid

## Output expectations

When generating file management code, the agent should:

- pick the right sandbox role with reasoning
- centralize path resolution
- always pair open/close
- use atomic write for state files
- stream large files
- treat picker URIs as opaque
- mention when exact API names still need official verification for the targeted SDK
