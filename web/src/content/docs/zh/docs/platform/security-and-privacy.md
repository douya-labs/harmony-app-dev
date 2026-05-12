---
title: "Security & Privacy"
description: "Use this file when a HarmonyOS task touches secrets, sensitive data, encryption, secure storage, or privacy-sensitive flows."
sidebar:
  order: 2
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/security-and-privacy.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/security-and-privacy.md)

## Purpose

Use this file when a HarmonyOS task touches secrets, sensitive data, encryption, secure storage, or privacy-sensitive flows.

Covers:

- Universal Keystore (HUKS): generating and using keys without exposing them
- secure storage of tokens, passwords, and small secrets
- transport security (HTTPS, certificate validation)
- privacy hygiene: minimization, purpose limitation, retention
- preparing for AppGallery review of sensitive features
- common security pitfalls in mobile app code

This file is the **engineering playbook** for security and privacy.
It does not replace official docs; verify HUKS algorithm names and certificate APIs from the references below.

## Capability mapping

This file maps to coverage matrix row **C9. Security and privacy**.

## Official documentation entry points

- HUKS (Universal Keystore Service) overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/huks-overview-V5
- HUKS development guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/huks-development-overview-V5
- @ohos.security.huks API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-huks-V5
- Cryptographic algorithm framework: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/cryptoframework-overview-V5
- @ohos.security.cryptoFramework API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-cryptoFramework-V5
- Privacy and permissions overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/privacy-protection-V5
- Network security configuration: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/network-securityconfig-V5

## Concept model

### Secrets vs preferences vs records
- **Secret** — material that grants access if leaked (token, password, private key, OAuth refresh token) → HUKS or HUKS-wrapped
- **Preference** — non-sensitive setting (theme, locale, opt-in flag) → Preferences
- **Record** — structured app data (history, list items) → RDB
- never mix categories: a token in Preferences is a security incident

### Two cryptography surfaces
- **HUKS** — managed keystore: generate, derive, sign, encrypt without the key ever leaving the secure store
- **Crypto framework** — primitives (AES, RSA, hashing, MAC) for cases where you handle key material yourself

Default to HUKS; reach for crypto framework when HUKS does not fit (e.g., one-off file integrity check).

### Privacy as a system, not a feature
- collect the minimum
- name the purpose
- name the retention
- offer deletion
- disclose third-party data sharing
- align privacy policy with code reality

Misalignment is the most common AppGallery rejection cause for sensitive features.

## Decision tree

```text
Need to handle sensitive material?
   │
   ├── auth token / password / refresh token / API key
   │     → HUKS (generate or import)
   │     → never store in Preferences/RDB plaintext
   │
   ├── encrypt local file / blob
   │     → HUKS-managed AES key + crypto framework for the actual encryption
   │
   ├── verify file integrity
   │     → crypto framework hashing (SHA-256)
   │
   ├── transport sensitive data
   │     → HTTPS only; consider certificate pinning for high-value endpoints
   │
   └── displaying sensitive data on screen
         → mask by default; explicit reveal only on user gesture
```

## Implementation patterns

> Snippets below are reference scaffolds. Verify exact API names against the targeted SDK before shipping.

### Pattern 1 — Generate an AES key in HUKS

```ts
import huks from '@ohos.security.huks'

const KEY_ALIAS = 'app_master_aes'

export async function ensureMasterKey(): Promise<void> {
  const exists = await keyExists(KEY_ALIAS)
  if (exists) return
  const options: huks.HuksOptions = {
    properties: [
      { tag: huks.HuksTag.HUKS_TAG_ALGORITHM, value: huks.HuksKeyAlg.HUKS_ALG_AES },
      { tag: huks.HuksTag.HUKS_TAG_KEY_SIZE, value: huks.HuksKeySize.HUKS_AES_KEY_SIZE_256 },
      { tag: huks.HuksTag.HUKS_TAG_PURPOSE, value: huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_ENCRYPT | huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_DECRYPT },
      { tag: huks.HuksTag.HUKS_TAG_BLOCK_MODE, value: huks.HuksCipherMode.HUKS_MODE_GCM },
      { tag: huks.HuksTag.HUKS_TAG_PADDING, value: huks.HuksKeyPadding.HUKS_PADDING_NONE }
    ]
  }
  await huks.generateKeyItem(KEY_ALIAS, options)
}

async function keyExists(alias: string): Promise<boolean> {
  try {
    await huks.isKeyItemExist(alias, { properties: [] })
    return true
  } catch {
    return false
  }
}
```

The key never leaves HUKS. Subsequent encrypt/decrypt operations reference it by alias.

### Pattern 2 — Encrypt small data with the master key

```ts
const TAG_LEN = 16

export async function encrypt(plain: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
  const options: huks.HuksOptions = {
    properties: [
      { tag: huks.HuksTag.HUKS_TAG_ALGORITHM, value: huks.HuksKeyAlg.HUKS_ALG_AES },
      { tag: huks.HuksTag.HUKS_TAG_PURPOSE, value: huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_ENCRYPT },
      { tag: huks.HuksTag.HUKS_TAG_BLOCK_MODE, value: huks.HuksCipherMode.HUKS_MODE_GCM },
      { tag: huks.HuksTag.HUKS_TAG_PADDING, value: huks.HuksKeyPadding.HUKS_PADDING_NONE },
      { tag: huks.HuksTag.HUKS_TAG_IV, value: iv }
    ],
    inData: plain
  }
  const handle = await huks.initSession(KEY_ALIAS, options)
  const result = await huks.finishSession(handle.handle, options)
  return result.outData!
}
```

Use a fresh, random IV per encryption. Store the IV alongside the ciphertext (it is not secret).

### Pattern 3 — Token storage facade

```ts
export class SecretStore {
  private prefs!: SettingsStore  // see persistence.md
  private masterKey: string = KEY_ALIAS

  async setToken(name: string, token: string): Promise<void> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ct = await encrypt(new TextEncoder().encode(token), iv)
    await this.prefs.setJson(`token:${name}`, {
      iv: Array.from(iv),
      ct: Array.from(ct)
    })
  }

  async getToken(name: string): Promise<string | null> {
    const stored = await this.prefs.getJson<any>(`token:${name}`, null)
    if (!stored) return null
    const pt = await decrypt(new Uint8Array(stored.ct), new Uint8Array(stored.iv))
    return new TextDecoder().decode(pt)
  }
}
```

The Preferences entry holds opaque ciphertext. The actual key never leaves HUKS.

### Pattern 4 — SHA-256 file integrity

```ts
import cryptoFramework from '@ohos.security.cryptoFramework'

export async function sha256(input: Uint8Array): Promise<Uint8Array> {
  const md = cryptoFramework.createMd('SHA256')
  await md.update({ data: input })
  const out = await md.digest()
  return out.data
}
```

Use for cache invalidation, content addressing, and integrity checks; never for password storage (use HUKS for those).

### Pattern 5 — HTTPS-only enforcement

In `module.json5` or the network security config, require HTTPS for all endpoints unless explicitly allow-listed for development. Combine with code-level guard:

```ts
export function assertHttps(url: string): void {
  if (!url.startsWith('https://')) {
    throw new Error(`refusing non-https url: ${url}`)
  }
}
```

Apply at the HttpClient boundary (see network.md) so call sites cannot bypass.

### Pattern 6 — Sensitive data display masking

```ts
@Component
struct PhoneCell {
  @Prop phone: string
  @State revealed: boolean = false

  build() {
    Row() {
      Text(this.revealed ? this.phone : maskPhone(this.phone))
      Button(this.revealed ? '隐藏' : '显示').onClick(() => { this.revealed = !this.revealed })
    }
  }
}

function maskPhone(p: string): string {
  if (p.length <= 7) return p
  return p.slice(0, 3) + '****' + p.slice(-4)
}
```

Default to masked; reveal on explicit user action.

## Common pitfalls

### Storing tokens in Preferences plaintext
A leaked Preferences file (rooted device, backup) leaks tokens directly. Always wrap secrets through HUKS-managed encryption.

### Reusing IVs in GCM mode
GCM with a reused IV/key pair is catastrophic for confidentiality. Generate a fresh random IV per encryption.

### Hand-rolled crypto
Implementing your own encryption / hashing / KDF is almost always wrong. Use HUKS or cryptoFramework primitives.

### Logging sensitive material
Redact in logs (see debugging.md); never log auth headers, tokens, or PII.

### Allowing cleartext HTTP for "just one endpoint"
That one endpoint becomes the breach point. Default to HTTPS everywhere.

### Trusting client-side validation
Permissions, rate limits, and authorization decisions belong on the server. Client checks are UX, not security.

### Wide privacy policy that does not match code
A vague policy that says "we may collect anything" will be flagged or distrusted. Be specific; align with what the code actually does.

### Embedding secrets in code or repo
API keys, OAuth client secrets, signing material in git history are leaked forever. Use environment / build config not committed to the repo.

### Forgetting key rotation
Keys age. Plan a path for re-encrypting under a new master key when needed; even if not implemented day one, do not paint yourself into a corner.

### Treating biometrics as identity
Biometrics gate access; they do not prove identity to a server. Pair with token-backed auth.

## Verification checklist (before shipping security-sensitive code)

1. tokens / passwords stored only via HUKS-wrapped encryption
2. fresh random IV per encryption
3. no hand-rolled crypto
4. HTTPS enforced at the HttpClient boundary
5. sensitive UI defaults to masked
6. no secrets in logs
7. no secrets in git or shipped binary
8. privacy policy aligned with actual data flows
9. third-party SDKs reviewed for what they collect
10. deletion / opt-out paths exist where required

## Fallback strategies when blocked

### When HUKS API is unfamiliar / over-budget for MVP
- still avoid storing tokens in Preferences plaintext
- as an interim, derive a per-install key from a randomly generated app secret stored in HUKS, and use cryptoFramework AES with that
- never ship plaintext tokens "for now"; defer the feature instead

### When certificate pinning breaks during dev
- pin only release builds
- maintain a debug-only allow-list

### When third-party SDK collects more than expected
- replace with a leaner SDK
- isolate it behind a small adapter so swap is cheap
- update privacy policy to match exactly what is collected

### When AppGallery raises a privacy issue
- read the citation literally
- shrink data collection to the minimum needed
- update policy and code together; resubmit

## Output expectations

When generating security-sensitive code, the agent should:

- name the data category (secret / PII / non-sensitive)
- choose the right storage tier (HUKS vs Preferences vs RDB)
- use HUKS for any secret material
- enforce HTTPS at the network boundary
- mask sensitive display by default
- never log secrets
- mention when exact API names still need official verification for the targeted SDK
