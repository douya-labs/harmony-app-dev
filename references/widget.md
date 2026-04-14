# widget

Consolidated from prior HarmonyOS Widget research notes and official documentation directions.

## Purpose

Use this file when a Harmony task involves desktop widgets / service cards.

## What this file is for

- reminding the agent that Widget work is a separate capability domain
- signaling that Widget is not just another normal page
- pointing the agent toward FormExtensionAbility and widget-specific lifecycle/update behavior

## Use this reference when the user asks for
- desktop widget
- service card
- home screen card
- widget refresh logic
- widget data binding

## Engineering rule

Do not assume normal page/component lifecycle rules apply directly to Widget work. Check official Widget documentation first.

## MVP note

For visual demo apps, Widget pages are usually not first priority unless the app explicitly centers on service card demos.
