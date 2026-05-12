import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const all = await getCollection('docs', ({ id }) =>
    id.startsWith('tutorials/') && !id.endsWith('tutorials/index'),
  );
  return rss({
    title: 'ohosdev — Tutorials',
    description: 'HarmonyOS / OpenHarmony tutorials and guides.',
    site: context.site,
    items: all.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate ?? new Date(),
      link: `/${post.id.replace(/\.mdx?$/, '')}/`,
    })),
  });
}
