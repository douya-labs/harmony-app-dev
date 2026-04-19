# component-library-policy

## Source-of-truth policy

The official ArkUI declarative component index should define the top-level grouping of our local Harmony component library.

Reference page:
- https://developer.huawei.com/consumer/cn/doc/harmonyos-references/arkui-declarative-comp

## Rule

For every component group that appears in the official ArkUI declarative component index:
- our local Harmony component library should contain a matching group entry
- the local grouping names should follow the official grouping as closely as practical
- missing groups should be added even if only as placeholders first
- each group can start lightweight, but must point to at least:
  - what the group is for
  - representative components
  - implementation notes / pitfalls when available
  - official lookup path or keyword

## Practical rollout

1. Extract the official group list from the source page.
2. Create a local group map in the component library.
3. Fill each group with at least minimal reference coverage.
4. Expand high-priority groups first when product work touches them.

## Current blocker

The Huawei docs site currently returns the SPA shell to command-line fetches in this environment, so the exact group list still needs to be extracted via a working browser/session or another reliable fetch path.

Until then, this policy still stands: official ArkUI declarative component groups are the target taxonomy for our local component library.
