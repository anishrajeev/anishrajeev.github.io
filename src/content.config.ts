import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.(md|mdx)',
    base: './src/content/posts',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      status: z.enum(['published', 'draft', 'unlisted', 'stale']).default('draft'),
      externalUrl: z.string().url().refine(
        (url) => ['https:', 'http:'].includes(new URL(url).protocol),
        'External posts must use an http:// or https:// URL',
      ).optional(),
      math: z.boolean().default(false),
      hero: image().optional(),
    }),
});

export const collections = { posts };
