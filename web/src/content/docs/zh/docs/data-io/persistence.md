---
title: "Persistence (Preferences / RDB / KV)"
description: "Use this file when a HarmonyOS task involves any of:"
sidebar:
  order: 1
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/persistence.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/persistence.md)

## Purpose

Use this file when a HarmonyOS task involves any of:

- saving user preferences or settings (KV style)
- saving structured app data (records, lists, history) that needs query
- caching API responses for offline / cold-start
- syncing data across devices in the HarmonyOS distributed ecosystem
- choosing between Preferences, RDB (SQLite), and KV stores
- migrating schema between app versions

This file is the **engineering playbook** for persistence in HarmonyOS apps.
It does not replace official docs; for exact storage APIs and the latest ArkData behavior, always verify against the official references below.

## Capability mapping

This file maps to coverage matrix row **C3. Persistence (ArkData)**.

## Official documentation entry points

- ArkData (data management) overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/data-mgmt-overview-V5
- Preferences (lightweight KV) guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/data-persistence-by-preferences-V5
- @ohos.data.preferences API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-data-preferences-V5
- Relational store (RDB / SQLite) guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/data-persistence-by-rdb-store-V5
- @ohos.data.relationalStore API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-data-relationalstore-V5
- Distributed KV store guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/data-sync-of-distributed-kv-store-V5
- @ohos.data.distributedKVStore API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-distributedkvstore-V5

> Storage APIs are version-sensitive. Confirm the targeted SDK supports the chosen API path before committing to a design.

## Concept model

HarmonyOS persistence sits in three tiers:

### Tier 1 — Preferences (lightweight KV)
- key-value store
- single-process, single-device
- backed by an in-memory map flushed to disk
- best for: settings, flags, small JSON blobs
- **not for**: large datasets, queryable records, multi-device sync

### Tier 2 — Relational store (RDB / SQLite)
- full SQL on top of SQLite
- query, index, transaction, migration support
- single-device, multi-process safe
- best for: lists of records, history, anything that needs filtering / sorting / aggregation

### Tier 3 — Distributed KV store
- KV with cross-device sync via the HarmonyOS distributed data service
- eventual consistency
- best for: data that must follow a user across phone / tablet / watch
- **not for**: complex queries (it is still KV)

### Decision matrix

| Need | Right tool |
|---|---|
| flag / setting | Preferences |
| user profile JSON | Preferences (small) or RDB (if queryable) |
| list of records (history, records) | RDB |
| full-text search | RDB with FTS or external indexing |
| cross-device sync | Distributed KV |
| sensitive secret | Universal Keystore (see security file, P1) |
| temporary cache | Preferences (small) or sandbox file (see file-management, P1) |

## Decision tree

```text
Need to persist data?
   │
   ├── small, simple, few keys
   │     → Preferences
   │
   ├── many records, need query / sort / transactions
   │     → RDB (relationalStore)
   │
   ├── must sync across the user's devices
   │     → Distributed KV
   │
   └── secret material (token, key, password)
         → Universal Keystore (do not use any of the above)
```

Then for any chosen store:

```text
1. Encapsulate behind a typed repository (do not scatter raw store calls)
2. Define a versioned schema or key namespace from day one
3. Provide migration path for store version bumps
4. Use async/await; never block UI on storage
5. Treat read errors as recoverable; default to empty / sane state
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Preferences typed wrapper

```ts
import preferences from '@ohos.data.preferences'
import common from '@ohos.app.ability.common'

const STORE_NAME = 'app_settings'

export class SettingsStore {
  private store!: preferences.Preferences

  async init(context: common.UIAbilityContext): Promise<void> {
    this.store = await preferences.getPreferences(context, STORE_NAME)
  }

  async getString(key: string, fallback = ''): Promise<string> {
    return (await this.store.get(key, fallback)) as string
  }

  async setString(key: string, value: string): Promise<void> {
    await this.store.put(key, value)
    await this.store.flush()
  }

  async getJson<T>(key: string, fallback: T): Promise<T> {
    const raw = (await this.store.get(key, '')) as string
    if (!raw) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    await this.store.put(key, JSON.stringify(value))
    await this.store.flush()
  }

  async remove(key: string): Promise<void> {
    await this.store.delete(key)
    await this.store.flush()
  }
}
```

Notes:

- `flush` writes to disk; without it, changes only live in memory until the process exits cleanly
- always default-to-fallback on read; never let UI crash on missing keys
- avoid storing very large blobs in Preferences; switch to RDB or files

### Pattern 2 — RDB schema + migration scaffold

```ts
import relationalStore from '@ohos.data.relationalStore'
import common from '@ohos.app.ability.common'

const DB_CONFIG: relationalStore.StoreConfig = {
  name: 'app.db',
  securityLevel: relationalStore.SecurityLevel.S1
}

const DB_VERSION = 2

export class AppDb {
  private store!: relationalStore.RdbStore

  async init(context: common.UIAbilityContext): Promise<void> {
    this.store = await relationalStore.getRdbStore(context, DB_CONFIG)
    await this.migrate()
  }

  private async migrate(): Promise<void> {
    const currentVersion = this.store.version
    if (currentVersion < 1) {
      await this.store.executeSql(`
        CREATE TABLE IF NOT EXISTS records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ts INTEGER NOT NULL,
          type TEXT NOT NULL,
          payload TEXT
        )
      `)
    }
    if (currentVersion < 2) {
      await this.store.executeSql(
        `ALTER TABLE records ADD COLUMN tag TEXT`
      )
    }
    this.store.version = DB_VERSION
  }
}
```

### Pattern 3 — RDB typed repository

```ts
export interface RecordRow {
  id: number
  ts: number
  type: string
  payload?: string
  tag?: string
}

export class RecordRepository {
  constructor(private store: relationalStore.RdbStore) {}

  async insert(input: Omit<RecordRow, 'id'>): Promise<number> {
    const valuesBucket: relationalStore.ValuesBucket = {
      ts: input.ts,
      type: input.type,
      payload: input.payload ?? null,
      tag: input.tag ?? null
    }
    return this.store.insert('records', valuesBucket)
  }

  async listRecent(limit = 50): Promise<RecordRow[]> {
    const predicates = new relationalStore.RdbPredicates('records')
    predicates.orderByDesc('ts').limitAs(limit)
    const result = await this.store.query(predicates, [
      'id', 'ts', 'type', 'payload', 'tag'
    ])
    const rows: RecordRow[] = []
    while (result.goToNextRow()) {
      rows.push({
        id: result.getLong(result.getColumnIndex('id')),
        ts: result.getLong(result.getColumnIndex('ts')),
        type: result.getString(result.getColumnIndex('type')),
        payload: result.getString(result.getColumnIndex('payload')) || undefined,
        tag: result.getString(result.getColumnIndex('tag')) || undefined
      })
    }
    result.close()
    return rows
  }

  async deleteOlderThan(ts: number): Promise<number> {
    const predicates = new relationalStore.RdbPredicates('records')
    predicates.lessThan('ts', ts)
    return this.store.delete(predicates)
  }
}
```

### Pattern 4 — Distributed KV minimal usage

```ts
import distributedKVStore from '@ohos.data.distributedKVStore'

export async function getDistKv(
  context: common.UIAbilityContext,
  appId: string,
  storeId: string
) {
  const manager = distributedKVStore.createKVManager({
    context,
    bundleName: appId
  })
  const store = await manager.getKVStore<distributedKVStore.SingleKVStore>(storeId, {
    createIfMissing: true,
    encrypt: true,
    backup: true,
    autoSync: true,
    kvStoreType: distributedKVStore.KVStoreType.SINGLE_VERSION,
    securityLevel: distributedKVStore.SecurityLevel.S2
  })
  return store
}
```

Cross-device sync requires the user to be signed into the same HarmonyOS account on both devices.

### Pattern 5 — Repository injection pattern

```ts
export class AppContext {
  settings!: SettingsStore
  records!: RecordRepository

  static async init(context: common.UIAbilityContext): Promise<AppContext> {
    const ctx = new AppContext()
    ctx.settings = new SettingsStore()
    await ctx.settings.init(context)
    const db = new AppDb()
    await db.init(context)
    ctx.records = new RecordRepository(db['store'])
    return ctx
  }
}
```

Initializing all stores in one place makes test mocking and lifecycle reasoning straightforward.

## Common pitfalls

### Forgetting `flush()` on Preferences
`put` only updates the in-memory copy. Without `flush()`, a process crash loses the change. Always flush after every write or batch.

### Storing binary blobs in Preferences
Preferences is optimized for small KV. Storing large JSON or binary blobs (images, base64) will degrade load time. Use RDB or sandbox files instead.

### Ignoring schema version
Skipping a migration scaffold means the app cannot evolve schema cleanly. Treat `DB_VERSION` and the `migrate()` ladder as mandatory from day one.

### Forgetting `result.close()`
RDB query results hold native cursors. Forgetting `result.close()` leaks them. Wrap in try/finally for non-trivial flows.

### Confusing distributed KV with cloud sync
Distributed KV syncs across the user's *own* devices via HarmonyOS distributed data service. It is not a cloud backend. For server sync, still use HTTP + your own backend.

### Picking distributed KV for queryable data
Distributed KV is still KV. Filtering, sorting, joining are not first-class. If the feature needs query, use RDB and design your own sync layer over HTTP.

### Storing secrets in Preferences or RDB
Tokens, passwords, and key material belong in Universal Keystore (HUKS), not in plaintext stores. A leaked Preferences or RDB file is a security incident.

### Blocking UI thread on init
Preferences and RDB initialization is async and may be slow on first run. Always init off the rendering path; show a splash / skeleton while initializing.

### Wrong securityLevel
Choosing `S1` for sensitive data weakens encryption guarantees; choosing `S4` for trivial data adds unnecessary overhead. Pick the level that matches the data sensitivity per the official guidance.

## Verification checklist (before shipping persistence)

1. correct tier chosen (Preferences vs RDB vs Distributed KV vs Keystore)
2. typed repository wraps every store
3. schema versioning + migration ladder in place (RDB)
4. all writes followed by flush (Preferences)
5. all reads have a sane fallback
6. cursors/results closed (RDB)
7. no secrets in Preferences or RDB
8. init runs off the UI rendering path
9. distributed KV usage is justified (cross-device value)
10. data deletion path exists (e.g., "clear data" UX)

## Fallback strategies when blocked

### When the exact ArkData API path differs in target SDK
- isolate every store call behind the repository so the underlying API can be swapped
- check Release Notes for module renames

### When RDB feels too heavy for early prototyping
- start with Preferences storing JSON arrays for the smallest dataset
- migrate to RDB once item count grows past a few hundred or query needs appear

### When distributed sync is unavailable in the test environment
- use single-device storage first
- design the data layer to be sync-agnostic (repository interface), then enable distributed KV later

### When data corruption is suspected
- expose a "reset app data" path in settings
- log schema version + row counts on startup via HiLog for diagnosability

## Output expectations

When generating implementation that touches persistence, the agent should:

- choose the right tier and explain why
- wrap every store in a typed repository
- include a migration ladder for RDB
- always flush Preferences writes
- avoid storing secrets in any of these tiers
- mention when exact API names still need official verification for the targeted SDK
