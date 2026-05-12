// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

const SITE = process.env.PUBLIC_SITE_URL || 'https://ohosdev.com';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'ohosdev',
      description:
        'Community-driven HarmonyOS / OpenHarmony developer hub. Tutorials, capability reference, and an open-source AgentSkill.',
      logo: { src: './src/assets/logo.svg', replacesTitle: true },
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        zh: { label: '简体中文', lang: 'zh-CN' },
      },
      social: { github: 'https://github.com/douya-labs/harmony-app-dev' },
      customCss: ['./src/styles/tailwind.css', './src/styles/custom.css'],
      head: [
        // AdSense script slot — only injected when PUBLIC_ADSENSE_CLIENT is set.
        ...(process.env.PUBLIC_ADSENSE_CLIENT
          ? [
              {
                tag: 'script',
                attrs: {
                  async: true,
                  src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.PUBLIC_ADSENSE_CLIENT}`,
                  crossorigin: 'anonymous',
                },
              },
            ]
          : []),
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: `${SITE}/og-image.png` },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: `${SITE}/og-image.png` },
        },
        // Multi-size favicon set (Starlight emits the SVG one; we add raster fallbacks).
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'alternate icon', href: '/favicon.ico' },
        },
      ],
      components: {
        // Use custom Head to inject hreflang + JSON-LD on every page
        Head: './src/components/StarHead.astro',
      },
      sidebar: [
        {
          label: '📖 Stories',
          translations: { 'zh-CN': '📖 开发日记' },
          autogenerate: { directory: 'stories' },
        },
        {
          label: '💡 Tips',
          translations: { 'zh-CN': '💡 小技巧' },
          autogenerate: { directory: 'tips' },
        },
        {
          label: '🎨 Showcase',
          translations: { 'zh-CN': '🎨 API 玩法' },
          autogenerate: { directory: 'showcase' },
        },
        {
          label: 'Reference Docs',
          translations: { 'zh-CN': '参考文档' },
          autogenerate: { directory: 'docs' },
          collapsed: true,
        },
        {
          label: 'Tutorials',
          translations: { 'zh-CN': '教程' },
          autogenerate: { directory: 'tutorials' },
          collapsed: true,
        },
        {
          label: 'About',
          translations: { 'zh-CN': '关于' },
          items: [
            { label: 'About douya', translations: { 'zh-CN': '关于豆芽' }, link: '/about/' },
            { label: 'The AgentSkill', translations: { 'zh-CN': 'AgentSkill' }, link: 'https://github.com/douya-labs/harmony-app-dev' },
          ],
        },
      ],
      lastUpdated: true,
      pagination: true,
      pagefind: true,
    }),
    tailwind({ applyBaseStyles: false }),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', zh: 'zh-CN' },
      },
    }),
  ],
});
