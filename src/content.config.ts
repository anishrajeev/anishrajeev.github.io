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
      status: z.enum(['published', 'draft', 'stale']).default('draft'),
      math: z.boolean().default(false),
      hero: image().optional(),
    }),
});

export const collections = { posts };
