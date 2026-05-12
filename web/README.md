# ohosdev web (`web/`)

Public web mirror of the [`harmony-app-dev`](..) AgentSkill. Lives at **https://ohosdev.com**.

Built with [Astro Starlight](https://starlight.astro.build/), Tailwind CSS, MDX, Pagefind. Output is fully static — designed for Cloudflare Pages.

## Local development

```bash
cd web
npm install              # one-time
npm run sync:refs        # regenerate /docs from ../references/
npm run dev              # http://localhost:4321
```

## Build

```bash
npm run build            # outputs ./dist with Pagefind index baked in
npm run preview          # serve ./dist locally
```

## Project layout

```
web/
├── astro.config.mjs            # Starlight + Tailwind + sitemap config
├── tailwind.config.mjs
├── src/
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx               # English home (splash)
│   │       ├── about.md / privacy.md / terms.md / contact.md
│   │       ├── tutorials/              # English tutorials (5 articles)
│   │       ├── docs/                   # English reference (auto-synced from ../references)
│   │       └── zh/                     # Chinese mirror of all of the above
│   ├── components/StarHead.astro       # injects hreflang + JSON-LD
│   ├── pages/rss.xml.js                # /rss.xml
│   ├── pages/zh/rss.xml.js             # /zh/rss.xml
│   └── styles/                         # Tailwind + custom Starlight overrides
└── public/                             # robots.txt, favicon
```

## Reference content

The `/docs/` pages are not hand-written. They are **auto-synced** from `../references/*.md` by `scripts/sync-references.mjs`:

- English version copies the original markdown verbatim.
- Chinese version starts with a `:::caution[Translation pending]` banner, then falls back to the English content. **Do not auto-translate** — translations should be done by humans and committed as PRs to `web/src/content/docs/zh/docs/`.

Re-run after editing `references/`:

```bash
npm run sync:refs
```

## SEO

Out of the box:

- `sitemap-index.xml` (via `@astrojs/sitemap`)
- `robots.txt` in `public/`
- `/rss.xml` and `/zh/rss.xml`
- Meta tags: title, description, canonical, og:, twitter: (Starlight defaults)
- Schema.org `TechArticle` + `BreadcrumbList` JSON-LD on tutorial / docs pages
- `hreflang` alternates (`en`, `zh-CN`, `x-default`) on every page

## Google AdSense

AdSense integration is **opt-in via env var** — nothing renders unless you set it.

```bash
# .env.local (or Cloudflare Pages env)
PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
```

When set, the `<head>` script tag is injected automatically. Ad slots inside content pages are placeholder `<div class="adslot">` boxes (see `src/styles/custom.css`); replace the placeholder with real `<ins class="adsbygoogle">` units once your AdSense application is approved.

## Deploying to Cloudflare Pages

The site is static and Cloudflare-Pages-ready. **Recommended setup is to connect the GitHub repo from the Cloudflare dashboard** — no API tokens, no GitHub Actions secrets needed.

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Pick the `douya-labs/harmony-app-dev` repo.
3. **Production branch:** `main` (or whichever branch you'll merge `feat/web-v1` into).
4. **Build configuration:**
   - **Framework preset:** Astro
   - **Build command:** `cd web && npm install && npm run sync:refs && npm run build`
   - **Build output directory:** `web/dist`
   - **Root directory:** *(leave blank)*
   - **Node version:** `20` (set `NODE_VERSION=20` env var)
5. **Environment variables** (optional):
   - `PUBLIC_SITE_URL=https://ohosdev.com`
   - `PUBLIC_ADSENSE_CLIENT=ca-pub-...` (only after AdSense approval)
6. **Custom domain:** add `ohosdev.com` (and `www.ohosdev.com` if you want), Cloudflare will provision the cert.

That's it. Pushes to the production branch deploy automatically. PRs get preview deployments.

## Roadmap (known TODO)

- Hand-translated Chinese versions for the 38 reference docs (currently English-fallback with a banner).
- Tag taxonomy and tag pages.
- A small "Edit this page on GitHub" footer (Starlight has built-in support; not yet enabled).
- Lighthouse perf pass.
