# development-workflow

Workflows for HarmonyOS development across environments where DevEco Studio is not directly available — most importantly **Linux / WSL writing code + Windows or macOS for DevEco validation**.

## Purpose

Use this file when:

- the writing environment is Linux / WSL (DevEco Studio has **no Linux release**)
- writing code with an AI agent on a server / cloud workspace, validating on a separate Windows or macOS machine
- planning how to ship code edits without round-tripping through DevEco for every small change
- choosing between git-based sync and direct shared-filesystem editing

## Capability mapping

This file is a workflow companion to:
- `project-skeleton.md` — what to write by hand
- `app-model.md` — runtime semantics
- `debugging.md` — log + crash collection on the validation device

## Reality check on platform support

DevEco Studio:

- ✅ Windows
- ✅ macOS
- ❌ Linux (no official release at the time of writing)

Most CLI tools that come bundled with DevEco (`hvigor`, `ohpm`, packaging utilities) are not stable as standalone CLI experiences on Linux. Treat any Linux-side `hvigor build` attempt as best-effort, not a reliable validation.

The runtime layer (HarmonyOS device + emulator) also requires Windows or macOS to drive — emulators and `hdc` device tooling are first-class only on those platforms.

## Decision tree

```text
Where am I writing code?
   │
   ├── Linux / WSL with no DevEco
   │     → Workflow A (write on Linux, validate on Windows/macOS via git)
   │
   ├── Cloud / server environment with no GUI
   │     → Workflow A (same — git is the boundary)
   │
   ├── Windows or macOS with DevEco installed locally
   │     → Workflow B (single-machine, just use DevEco normally)
   │
   └── Hybrid — code mostly written by AI agent, validated by human reviewer
         → Workflow C (agent commits + push, human DevEco import + screenshot back)
```

## Workflow A — Linux / WSL writing + Windows DevEco validating (recommended)

### Setup once

1. Linux side
   - clone the project to `~/workspace/<project>` (or any standard path)
   - hand-write or generate the project skeleton per `project-skeleton.md`
   - configure git remote (prefer SSH to avoid proxy surprises)

2. Windows side (one-time)
   - install DevEco Studio + the targeted HarmonyOS SDK
   - clone the same git repo to a Windows-native path (avoid editing through `\\wsl$\...` to keep file watchers + casing reliable)
   - run `File → Open` on the project's app/ directory and let DevEco fix first-import warnings (icon, signing config, etc.)
   - make sure the Windows-side workspace has matching git identity

### Iteration loop

```
Linux agent ──┐
              │ 1. write / edit code
              │ 2. commit + push                  (git as the boundary)
              ↓
              GitHub / GitLab
              ↑
              │ 3. Windows DevEco: pull
              │ 4. build → run on emulator / real device
              │ 5. report errors / screenshots / hilog back
Windows reviewer ──┘
```

### Why git, not shared filesystem

Tempting alternative: write directly into `/mnt/c/Users/.../project` so Windows DevEco sees changes live.

Problems with that:

- WSL ↔ NTFS line-ending and permission drift
- DevEco file watchers behave inconsistently on cross-FS paths
- git inside WSL on `/mnt/c/...` is much slower
- `oh_modules/` and `build/` outputs mix with WSL-side scratch state

Git as the boundary is **slower per-edit but far more predictable**. For an AI agent it's also auditable: every change has a commit message.

### Useful conventions

- commit every coherent slice (one stage of a plan, one bug fix), don't batch days of work
- include in commit messages: which references (`harmony-app-dev/references/<file>.md`) informed the change
- when adding a step that requires DevEco verification, add a `Pending: <what to verify>` line to the commit message

## Workflow B — Single-machine (Windows or macOS)

The standard supported path. Use DevEco's "New Project → Empty Ability", iterate inside DevEco, commit through git or through DevEco's git integration. Nothing in this skill specifically helps here beyond the rest of the references.

## Workflow C — AI agent on Linux + human DevEco reviewer on Windows

Pattern of use:

1. agent reads `coverage.md` + `capability-map.md` to classify the task
2. agent writes ArkTS / config changes on Linux per the relevant references
3. agent commits + pushes
4. agent posts (in chat, ticket, or message tool) a short verification request:

```
Stage <N> done. Pushed: <short SHA / branch>.
Please pull + DevEco import + run on emulator.
Specifically check:
  - <UI behavior> on first launch
  - <build warning text> if any
Send back: build log tail + a screenshot of the first page.
```

5. human runs DevEco, sends back the result
6. agent processes the feedback, fixes, repeats

This loop's bottleneck is the human's verification turnaround, so each push should be substantive (one stage of a plan), not micro-edits.

## Common pitfalls

### Trying to install DevEco on Linux
There is no Linux release. Time spent looking is wasted. Build the workflow around remote validation instead.

### Editing through `/mnt/c/...` from WSL
Causes line-ending drift, file watcher confusion, and slow git. Edit on a real Linux path on the Linux side, sync via git.

### Forgetting `.idea/`, `.hvigor/`, `oh_modules/` in `.gitignore`
DevEco regenerates these on import. Without `.gitignore` rules they pollute every PR and cause "modified by Windows" noise. See `project-skeleton.md` for the canonical `.gitignore`.

### HTTPS git remote in proxied environments
HTTPS git push/pull through corporate or edge proxies frequently fails or is slow. Prefer SSH remotes for the writing environment.

### Mixing two workspaces with different SDK versions
Linux side has no SDK; Windows side does. Both still must agree on which SDK target the project declares (`minAPIVersion` / `targetAPIVersion` in `app.json5`). Treat the Windows-side DevEco as authoritative for SDK availability — if it can't build, the Linux-side skeleton must be adjusted.

### Pushing without telling the human reviewer what to verify
A push without a verification request silently sits there. Always pair "I pushed X" with "please verify Y on DevEco" so the loop closes.

### Generating signing material on Linux
Debug signing certificates should be generated by DevEco (or matching CLI on Windows/macOS) so they're compatible with the local SDK toolchain. Don't hand-craft signing material on Linux for HarmonyOS.

### Asking the agent to "just run hvigor build" on Linux
Even if `node` and a partial OpenHarmony SDK are present on Linux, `hvigor` reliability is poor and emulator validation impossible. Don't waste turns trying to compile on Linux — push to git and let Windows DevEco be the build oracle.

## Verification checklist (when handing off to Windows DevEco)

1. project compiles in your head from the skeleton (all referenced strings/colors/icons exist)
2. commit message lists exactly what to verify
3. branch / commit SHA shared in the verification request
4. `.gitignore` covers DevEco-generated files
5. no signing material in the commit
6. README in the app/ folder explains "how to import" so a teammate doesn't have to ask

## Fallback strategies when blocked

### When the human reviewer is unavailable
- pause feature work
- catch up on `references/` reading and skill improvements
- never push untested guesses as "done"

### When DevEco import keeps failing on Windows
- have the reviewer create a fresh "New Project → Empty Ability" in DevEco
- diff the generated skeleton against the hand-written one
- copy any missing mandatory file or config block back to the repo
- update `project-skeleton.md` with the gap so the next bootstrap doesn't repeat the mistake

### When git push is the only blocker
- ensure SSH remote is configured (see TOOLS.md / git remote conventions)
- if behind a proxy, document the proxy config separately, not in the project repo

## Output expectations

When operating under Workflow A or C, the agent should:

- treat git as the validation boundary, not the filesystem
- commit in coherent slices, with messages naming which references informed the change
- explicitly request human DevEco verification when a stage is "done on Linux but not yet validated"
- avoid spending turns trying to install DevEco on Linux or run unreliable Linux builds
- update `project-skeleton.md` whenever a new "DevEco refused to import" failure is encountered, so the workflow improves over time
