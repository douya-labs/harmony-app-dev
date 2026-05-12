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
      logo: { src: './src/assets/logo.svg', replacesTitle: false },
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        zh: { label: '简体中文', lang: 'zh-CN' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/douya-labs/harmony-app-dev' },
      ],
      customCss: ['./src/styles/tailwind.css', './src/styles/custom.css'],
      head: [
        // AdSense script slot — only injected when PUBLIC_ADSENSE_CLIENT is set.
        ...(process.env.PUBLIC_ADSENSE_CLIENT
          ? [
              {
                tag: 'script',
                attrs: {
                  async: true,
                  src: `https://pagead2.googlesynndication.com/pagead/js/adsbygoogle.js?client=${process.env.PUBLIC_ADSENSE_CLIENT}`,
                  crossorigin: 'anonymous',
                },
              },
            ]
          : []),
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
      ],
      components: {
        // Use custom Head to inject hreflang + JSON-LD on every page
        Head: './src/components/StarHead.astro',
      },
      sidebar: [
        {
          label: 'Tutorials',
          translations: { 'zh-CN': '教程' },
          autogenerate: { directory: 'tutorials' },
        },
        {
          label: 'Reference Docs',
          translations: { 'zh-CN': '参考文档' },
          autogenerate: { directory: 'docs' },
          collapsed: true,
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
