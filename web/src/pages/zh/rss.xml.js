import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const all = await getCollection('docs', ({ id }) =>
    id.startsWith('zh/tutorials/') && !id.endsWith('tutorials/index'),
  );
  return rss({
    title: 'ohosdev — 教程',
    description: 'HarmonyOS / OpenHarmony 中文教程与指南。',
    site: context.site,
    items: all.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate ?? new Date(),
      link: `/${post.id.replace(/\.mdx?$/, '')}/`,
    })),
  });
}
