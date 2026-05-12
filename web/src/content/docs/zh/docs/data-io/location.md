---
title: "Location"
description: "Use this file when a HarmonyOS task involves any of:"
sidebar:
  order: 5
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/location.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/location.md)

## Purpose

Use this file when a HarmonyOS task involves any of:

- getting the device's current location (one-shot)
- subscribing to location updates (continuous)
- choosing between approximate and precise location
- requesting location permissions and handling denial
- geocoding (address ↔ coordinate)
- background location considerations
- privacy and AppGallery review around location use

This file is the **engineering playbook** for location features.
It does not replace official docs; verify exact request option fields and accuracy levels from the references below.

## Capability mapping

This file maps to coverage matrix row **C8. Location**.

## Official documentation entry points

- Location Kit overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/location-overview-V5
- Single location request guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/location-currentlocation-V5
- Continuous location guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/location-locationupdate-V5
- Geocoding guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/location-geocoding-V5
- @ohos.geoLocationManager API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-geoLocationManager-V5
- Permission `ohos.permission.APPROXIMATELY_LOCATION`: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/permission-list-V5
- Permission `ohos.permission.LOCATION`: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/permission-list-V5
- Background location considerations: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/background-task-overview-V5

> Background location is highly restricted on HarmonyOS. Always plan for foreground-only usage as the baseline.

## Concept model

### Two permission tiers
- **APPROXIMATELY_LOCATION** — coarse-grained (city / district level)
- **LOCATION** — precise-grained (meters)
- the system may grant only the approximate permission even when precise is requested
- the app must work usefully with whichever is granted

### Two request modes
- **single** — one location, then done; cheap, fast
- **continuous** — stream of updates; expensive, drains battery; use sparingly

### Foreground vs background
- foreground location is the default and is what most apps need
- background location requires `LOCATION_IN_BACKGROUND` permission and a strong justification for AppGallery review
- treat background as a deliberate design decision, not a default

### Coordinate systems
- HarmonyOS exposes WGS-84 by default
- some downstream services (maps, server APIs) expect GCJ-02 or BD-09 in mainland China
- conversion is the app's responsibility; document the chosen system end-to-end

## Decision tree

```text
Need location?
   │
   ├── one-shot, low-precision (city, region tag)
   │     → APPROXIMATELY_LOCATION + getCurrentLocation
   │
   ├── one-shot, precise (search nearby store)
   │     → LOCATION + getCurrentLocation
   │
   ├── continuous (navigation, run tracking)
   │     → LOCATION + on('locationChange', ...)
   │     → declare clear UI indicator
   │
   ├── reverse-geocode coordinate to address
   │     → geoLocationManager.getAddressesFromLocation
   │
   ├── geocode address to coordinate
   │     → geoLocationManager.getAddressesFromLocationName
   │
   └── background location
         → strong justification required; design around foreground first
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Declare permissions

```json5
{
  "module": {
    "requestPermissions": [
      {
        "name": "ohos.permission.APPROXIMATELY_LOCATION",
        "reason": "$string:reason_location",
        "usedScene": { "abilities": ["EntryAbility"], "when": "inuse" }
      },
      {
        "name": "ohos.permission.LOCATION",
        "reason": "$string:reason_location_precise",
        "usedScene": { "abilities": ["EntryAbility"], "when": "inuse" }
      }
    ]
  }
}
```

Always declare APPROXIMATELY first. The system may grant only that even when LOCATION is also requested.

### Pattern 2 — Request location permission at runtime

See `permissions.md` for the full UX flow. Snippet:

```ts
import abilityAccessCtrl from '@ohos.abilityAccessCtrl'

export async function requestLocationPermissions(context): Promise<{ approximate: boolean; precise: boolean }> {
  const atManager = abilityAccessCtrl.createAtManager()
  const result = await atManager.requestPermissionsFromUser(context, [
    'ohos.permission.APPROXIMATELY_LOCATION',
    'ohos.permission.LOCATION'
  ])
  return {
    approximate: result.authResults[0] === 0,
    precise: result.authResults[1] === 0
  }
}
```

### Pattern 3 — Single current location

```ts
import geoLocationManager from '@ohos.geoLocationManager'

export interface LatLng { latitude: number; longitude: number; accuracy: number }

export async function getCurrentLatLng(precise: boolean): Promise<LatLng> {
  const request: geoLocationManager.SingleLocationRequest = {
    locatingPriority: precise
      ? geoLocationManager.LocatingPriority.PRIORITY_ACCURACY
      : geoLocationManager.LocatingPriority.PRIORITY_LOW_POWER,
    locatingTimeoutMs: 8000
  }
  const loc = await geoLocationManager.getCurrentLocation(request)
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: loc.accuracy
  }
}
```

Notes:

- choose `PRIORITY_ACCURACY` only when the feature actually needs meters
- always set a timeout; outdoor first-fix can take seconds
- handle the rejection path (timeout, permission revoked) gracefully

### Pattern 4 — Continuous location updates

```ts
type LocationListener = (loc: LatLng) => void

export function startLocationUpdates(listener: LocationListener): () => void {
  const request = {
    priority: geoLocationManager.LocationRequestPriority.ACCURACY,
    scenario: geoLocationManager.LocationRequestScenario.NAVIGATION,
    timeInterval: 1,
    distanceInterval: 5,
    maxAccuracy: 0
  }
  const cb = (loc) => listener({
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: loc.accuracy
  })
  geoLocationManager.on('locationChange', request, cb)
  return () => geoLocationManager.off('locationChange', cb)
}
```

Always provide an unsubscribe path. Forgetting to call `off` keeps the GPS hot and drains battery.

### Pattern 5 — Reverse geocoding

```ts
export async function reverseGeocode(loc: LatLng): Promise<string | null> {
  const req: geoLocationManager.ReverseGeoCodeRequest = {
    latitude: loc.latitude,
    longitude: loc.longitude,
    maxItems: 1
  }
  try {
    const list = await geoLocationManager.getAddressesFromLocation(req)
    if (!list || list.length === 0) return null
    const a = list[0]
    return [a.administrativeArea, a.locality, a.subLocality, a.placeName]
      .filter(Boolean).join(' ')
  } catch {
    return null
  }
}
```

### Pattern 6 — Forward geocoding (address to coordinate)

```ts
export async function geocode(query: string): Promise<LatLng[]> {
  const req: geoLocationManager.GeoCodeRequest = {
    description: query,
    maxItems: 5
  }
  const list = await geoLocationManager.getAddressesFromLocationName(req)
  return list.map((a) => ({
    latitude: a.latitude,
    longitude: a.longitude,
    accuracy: 0
  }))
}
```

### Pattern 7 — Distance and "near" check

```ts
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const φ1 = a.latitude * Math.PI / 180
  const φ2 = b.latitude * Math.PI / 180
  const dφ = (b.latitude - a.latitude) * Math.PI / 180
  const dλ = (b.longitude - a.longitude) * Math.PI / 180
  const x = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

export function isWithin(a: LatLng, b: LatLng, meters: number): boolean {
  return distanceMeters(a, b) <= meters
}
```

Useful for "are they near a store" without a backend round-trip.

## Common pitfalls

### Asking for precise without a use case
AppGallery review and users both punish over-permissioning. If the feature only needs region or city, request only APPROXIMATELY_LOCATION.

### Asking at app launch
Asking for location at first launch destroys grant rate. Ask in-context, on the first feature that needs it.

### Forgetting to unsubscribe
`geoLocationManager.on('locationChange', ...)` keeps the GPS hot. Always pair with `off` on disappear, page leave, or feature exit.

### Treating WGS-84 as universal
Mainland China map services often use GCJ-02 or BD-09. Drawing WGS-84 points on a GCJ-02 map produces visible offset. Convert at the boundary.

### Background expectations
Assuming background updates work without `LOCATION_IN_BACKGROUND` and a documented justification will fail review and runtime. Design around foreground-only when possible.

### Ignoring `accuracy`
A returned location with `accuracy: 500` (meters) is not "the user's spot" — using it as if it were causes wrong UX. Honor accuracy in distance / matching logic.

### Tight loops on first-fix failure
If GPS first-fix fails, retrying immediately rarely helps. Prefer a single retry after delay, then surface "could not locate" UX.

### No fallback when permission denied
Many features can degrade gracefully (e.g., manual city pick). Always have a non-location path so denial is not a dead-end.

### Logging coordinates
Coordinates are PII. Do not log them in production analytics or send them to third-party services without explicit privacy disclosure.

## Verification checklist (before shipping a location feature)

1. lowest sufficient permission tier requested (approximate vs precise)
2. permission requested in-context, not at launch
3. all subscriptions paired with unsubscribe
4. accuracy honored in matching / distance logic
5. coordinate system consistent end-to-end (WGS-84 vs GCJ-02 vs BD-09)
6. timeouts on single requests
7. graceful "no location" UX path
8. no background location unless explicitly designed and justified
9. coordinates not logged or shared without consent
10. denial / revocation paths surface helpful UX, not silent failure

## Fallback strategies when blocked

### When precise is denied but approximate is granted
- use approximate to derive city / region
- prompt manual confirmation for finer granularity
- avoid features that strictly require meters

### When all location is denied
- expose a manual location picker (city list, address input + geocode)
- save user choice to Preferences for next session

### When indoor first-fix fails
- accept network-derived approximate location
- show "low accuracy" UI hint
- allow user to confirm a manual pick

### When required SDK accuracy class is missing in target
- fall back to a coarser priority/scenario combination
- check Release Notes for renames

## Output expectations

When generating location implementation, the agent should:

- request the lowest sufficient permission tier
- always pair subscriptions with unsubscribe
- name the coordinate system used
- handle accuracy explicitly
- avoid background location by default
- provide a non-location fallback
- mention when exact API names still need official verification for the targeted SDK
