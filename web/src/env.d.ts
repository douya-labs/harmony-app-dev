// @ts-check
/**
 * env.d.ts
 */
/// <reference types="astro/client" />
/// <reference types="@astrojs/starlight/types" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_ADSENSE_CLIENT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
