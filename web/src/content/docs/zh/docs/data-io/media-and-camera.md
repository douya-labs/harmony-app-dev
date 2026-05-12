---
title: "Media & Camera"
description: "Use this file when a HarmonyOS task involves any of:"
sidebar:
  order: 4
---

import { Aside } from '@astrojs/starlight/components';

:::caution[Translation pending]
此页中文版本尚未翻译。下方内容暂以英文显示，欢迎在 GitHub 提交翻译 PR。
:::

> Reference doc — auto-synced from the [`harmony-app-dev`](https://github.com/douya-labs/harmony-app-dev) AgentSkill.
> Source: [`references/media-and-camera.md`](https://github.com/douya-labs/harmony-app-dev/blob/main/references/media-and-camera.md)

## Purpose

Use this file when a HarmonyOS task involves any of:

- capturing photos or videos via the system camera
- letting the user pick images or videos from the gallery
- recording or playing audio
- reading or writing media files in the user-visible media library
- handling media file URIs (`file://` vs `dataability://` vs sandbox paths)
- decoding / encoding images for thumbnails, previews, or upload preprocessing
- reading EXIF metadata for time, location, orientation

This file is the **engineering playbook** for media and camera in HarmonyOS apps.
It does not replace official docs; for exact API signatures and capability negotiation, always verify against the official references below.

## Capability mapping

This file maps to coverage matrix row **C5. Camera and media**.

## Official documentation entry points

- Camera Kit overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/camera-overview-V5
- @ohos.multimedia.camera API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-camera-V5
- Image Kit overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/image-overview-V5
- @ohos.multimedia.image API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-image-V5
- Picker (file/photo picker) guide: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/photoviewpicker-V5
- @ohos.file.picker API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-file-picker-V5
- Media Library Kit overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/photoAccessHelper-overview-V5
- @ohos.file.photoAccessHelper API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-photoAccessHelper-V5
- Audio Kit overview: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/audio-kit-V5
- @ohos.multimedia.media API: https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-media-V5

> The exact module path for media library access has evolved across SDK versions (`mediaLibrary` → `photoAccessHelper`). Always confirm against the targeted SDK.

## Concept model

HarmonyOS media work splits into four concerns an agent should keep separate:

### 1. Capture vs Pick
- **Capture** — open the camera, the user takes a new photo/video
- **Pick** — open the system picker, the user selects existing media
- These have different permission, UX, and review implications

### 2. Storage location
- **App sandbox** — private to the app, no permission needed for app's own files
- **User media library** — shared, requires media library permissions, visible to other apps and the system gallery
- Default to sandbox; promote to media library only if the user explicitly saves

### 3. URI shape
- `file://` paths are common for sandbox files
- media library returns URIs through the picker; do not assume their internal path
- pass URIs through; do not try to parse them into raw filesystem paths

### 4. Permission shape
- camera capture → `ohos.permission.CAMERA`
- saving to media library → media library write permission
- reading existing user media via picker → typically no permission (the picker grants one-shot access)
- raw media library traversal → media library read permission

The picker pattern is strongly preferred for both UX and review reasons.

## Decision tree

```text
Need media in the app?
   │
   ├── user picks an existing photo/video
   │     → use Picker (PhotoViewPicker)
   │     → no media-library read permission needed
   │
   ├── user takes a new photo/video
   │     → request CAMERA permission
   │     → either use Camera Kit (custom capture UI)
   │       or launch system camera ability (simpler, less control)
   │
   ├── play audio / video
   │     → @ohos.multimedia.media (AVPlayer)
   │
   ├── record audio
   │     → request MICROPHONE permission
   │     → AVRecorder
   │
   └── save a file the app generated to user gallery
         → photoAccessHelper write API (request write permission first)
```

## Implementation patterns

> All snippets below are reference scaffolds. Verify the exact API name, signature, and SDK version against the official references before shipping.

### Pattern 1 — Pick a photo via PhotoViewPicker

```ts
import picker from '@ohos.file.picker'

export async function pickOnePhoto(): Promise<string | null> {
  const photoSelectOptions = new picker.PhotoSelectOptions()
  photoSelectOptions.MIMEType = picker.PhotoViewMIMETypes.IMAGE_TYPE
  photoSelectOptions.maxSelectNumber = 1

  const photoPicker = new picker.PhotoViewPicker()
  const result = await photoPicker.select(photoSelectOptions)
  if (!result.photoUris || result.photoUris.length === 0) {
    return null
  }
  return result.photoUris[0]
}
```

Notes:

- the returned URI is grant-on-the-fly; the app can read it without a media-library permission
- copy the file into the app sandbox immediately if longer-term access is needed
- `MIMEType` filter prevents the picker from showing irrelevant media

### Pattern 2 — Take a photo via the system camera ability

```ts
import common from '@ohos.app.ability.common'
import Want from '@ohos.app.ability.Want'

export async function takePhoto(context: common.UIAbilityContext): Promise<string | null> {
  const want: Want = {
    action: 'ohos.want.action.imageCapture'
  }
  const result = await context.startAbilityForResult(want)
  if (result.resultCode !== 0) return null
  const uri = result.want?.parameters?.['resourceUri'] as string | undefined
  return uri ?? null
}
```

Use this when full camera control is not required. For custom capture UI, use Camera Kit directly (see Pattern 3).

### Pattern 3 — Custom camera capture (sketch)

```ts
import camera from '@ohos.multimedia.camera'

export class CameraSession {
  private cameraManager!: camera.CameraManager
  private session!: camera.CaptureSession
  private photoOutput!: camera.PhotoOutput

  async setup(context: common.BaseContext, surfaceId: string): Promise<void> {
    this.cameraManager = camera.getCameraManager(context)
    const cameras = this.cameraManager.getSupportedCameras()
    if (cameras.length === 0) throw new Error('no camera available')
    const input = this.cameraManager.createCameraInput(cameras[0])
    await input.open()

    const profile = this.cameraManager
      .getSupportedOutputCapability(cameras[0])
      .photoProfiles[0]
    const previewProfile = this.cameraManager
      .getSupportedOutputCapability(cameras[0])
      .previewProfiles[0]

    const previewOutput = this.cameraManager.createPreviewOutput(previewProfile, surfaceId)
    this.photoOutput = this.cameraManager.createPhotoOutput(profile)

    this.session = this.cameraManager.createCaptureSession()
    this.session.beginConfig()
    this.session.addInput(input)
    this.session.addOutput(previewOutput)
    this.session.addOutput(this.photoOutput)
    await this.session.commitConfig()
    await this.session.start()
  }

  async capture(): Promise<void> {
    await this.photoOutput.capture()
  }

  async release(): Promise<void> {
    await this.session.stop()
    await this.session.release()
  }
}
```

Custom capture is significantly more code. Use only when the system camera ability cannot meet UX needs (e.g., custom overlay, real-time effects, scan-style flow).

### Pattern 4 — Decode and resize an image

```ts
import image from '@ohos.multimedia.image'

export async function loadAndResize(
  uri: string,
  maxEdge: number
): Promise<image.PixelMap> {
  const source = image.createImageSource(uri)
  const info = await source.getImageInfo()
  const longEdge = Math.max(info.size.width, info.size.height)
  const scale = longEdge > maxEdge ? maxEdge / longEdge : 1

  const decodingOptions: image.DecodingOptions = {
    desiredSize: {
      width: Math.round(info.size.width * scale),
      height: Math.round(info.size.height * scale)
    }
  }
  const pixelMap = await source.createPixelMap(decodingOptions)
  source.release()
  return pixelMap
}
```

Returned `PixelMap` should be passed to `Image` component or encoded back to a file before upload.

### Pattern 5 — Read EXIF metadata

```ts
export async function readExifTimestamp(uri: string): Promise<number | null> {
  const source = image.createImageSource(uri)
  try {
    const dateTimeStr = await source.getImageProperty(image.PropertyKey.DATE_TIME_ORIGINAL)
    if (!dateTimeStr) return null
    return parseExifDateTime(dateTimeStr)
  } catch {
    return null
  } finally {
    source.release()
  }
}

function parseExifDateTime(s: string): number | null {
  // EXIF format: "YYYY:MM:DD HH:MM:SS"
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!m) return null
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
}
```

EXIF reading is essential for "real capture" verification flows — pair with permission/UX checks for anti-cheating use cases.

### Pattern 6 — AVPlayer minimal audio playback

```ts
import media from '@ohos.multimedia.media'

export class AudioPlayer {
  private player?: media.AVPlayer

  async play(uri: string): Promise<void> {
    this.player = await media.createAVPlayer()
    this.player.url = uri
    return new Promise((resolve, reject) => {
      this.player!.on('stateChange', (state) => {
        if (state === 'initialized') this.player!.prepare()
        if (state === 'prepared') this.player!.play()
        if (state === 'completed') resolve()
        if (state === 'error') reject(new Error('player error'))
      })
    })
  }

  async stop(): Promise<void> {
    await this.player?.stop()
    await this.player?.release()
    this.player = undefined
  }
}
```

## Common pitfalls

### Forgetting to copy picker URIs to sandbox
The picker grants on-the-fly access. After the user closes the picker, the URI may not be readable later. If long-term access is needed, copy the file into the app sandbox immediately.

### Trying to parse media URIs as filesystem paths
Media library URIs are opaque. Pass them to media APIs; do not split or rewrite them. Custom path manipulation breaks across versions.

### Confusing system camera ability with Camera Kit
- **System camera ability** — fast, no custom UI, less code, no `CAMERA` permission required (the camera app handles it)
- **Camera Kit** — full control, custom UI, requires `CAMERA` permission and significantly more setup

Pick the right one for the requirement.

### Holding ImageSource without releasing
`image.createImageSource` allocates native memory. Forgetting `source.release()` leaks. Always release in `finally`.

### Decoding huge images at full size
Loading a 4032×3024 photo as full PixelMap can OOM the UI. Always pass `desiredSize` to downsample at decode time.

### Wrong PhotoViewMIMETypes
Filtering by the wrong MIME constant may show no media or the wrong media type. Verify the constant against the current SDK.

### Missing audio focus management
Playing audio without acquiring audio focus causes overlap with system sounds and other apps. For non-trivial audio, use the official audio focus API.

### Saving to media library without permission
Writing into the user's gallery via `photoAccessHelper` requires explicit write permission. Without it, the call fails with a confusing error. Declare and request first.

### Treating EXIF time as device-local
EXIF datetime is camera-local; treat it carefully when comparing to server time or Unix timestamps. Note any timezone assumptions explicitly in code.

## Verification checklist (before shipping a media feature)

1. correct API chosen (picker vs camera ability vs Camera Kit)
2. permissions declared and requested in-context (camera, microphone, media library write if applicable)
3. URIs from picker are copied to sandbox if needed beyond the immediate flow
4. ImageSource and PixelMap are released
5. images are downsampled at decode time
6. audio playback acquires and releases audio focus
7. EXIF parsing is defensive (null-safe, format-checked)
8. error path returns typed error and a recoverable UX
9. sensitive metadata (location in EXIF) is handled per privacy policy
10. uploads use streaming where the file is large (see network.md)

## Fallback strategies when blocked

### When the exact API path has changed in target SDK
- check Release Notes for module renames (`mediaLibrary` → `photoAccessHelper`)
- isolate media access behind a small adapter so the call site does not change

### When custom Camera Kit setup is too costly for MVP
- use the system camera ability (Pattern 2)
- accept loss of custom UI; ship the feature, revisit later

### When image decoding performance is too slow on device
- downsample more aggressively at decode
- decode on a worker (see future concurrency.md)
- consider server-side resizing for upload preview

### When EXIF is missing or stripped
- fall back to file modification time
- mark the record's source as `manual` instead of `verified-capture`

## Output expectations

When generating implementation that touches media or camera, the agent should:

- explicitly choose between picker, camera ability, and Camera Kit, with reasoning
- declare and request the right permissions in-context
- release all native resources (`ImageSource`, sessions, players)
- downsample images at decode time
- treat URIs as opaque
- mention when exact API names still need official verification for the targeted SDK
