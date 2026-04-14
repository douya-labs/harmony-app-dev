# official-search-playbook

## Purpose

Use this file when exact HarmonyOS API names, properties, references, or implementation details must be verified from official docs.

## Official entry points

- HarmonyOS docs home: `https://developer.huawei.com/consumer/cn/doc/`
- Guides: `https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5`
- References: `https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V6`
- Release Notes: `https://developer.huawei.com/consumer/cn/doc/harmonyos-releases-V6`

## Search pattern

### Step 1: start with the capability keyword
Examples:
- `HarmonyOS ArkUI blur`
- `HarmonyOS ArkUI shadow`
- `HarmonyOS ArkUI spring animation`
- `HarmonyOS ArkUI gesture`
- `HarmonyOS Canvas ArkTS`
- `HarmonyOS shared transition`
- `HarmonyOS Component3D`
- `HarmonyOS Widget FormExtensionAbility`

### Step 2: read Guide before Reference
- Guide = understand the feature and recommended usage
- Reference = confirm exact API names and signatures

### Step 3: confirm exact names before coding
Never rely on memory for:
- property names
- decorator names
- method signatures
- component capability boundaries

## Fallback rule

If exact official API confirmation takes too long and the UX can still be delivered for MVP with simpler ArkUI-native composition, ship the fallback and explicitly note that it is a fallback implementation.

## Output rule

When using official lookup, include in the answer:
- what was being verified
- which official entry point/category should be checked
- whether the final implementation is exact or fallback-based
