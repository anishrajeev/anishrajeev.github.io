import { defineConfig } from 'astro/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import contentResources from './plugins/content-resources.mjs';
import remarkAnimation from './plugins/remark-animation.mjs';
import remarkCodeFile from './plugins/remark-code-file.mjs';
import remarkMedia from './plugins/remark-media.mjs';
import remarkProof from './plugins/remark-proof.mjs';
import katexMacros from './src/styles/katex-macros.js';

const outDir = new URL('./dist/', import.meta.url);

export default defineConfig({
  site: 'https://anish.ink',
  outDir: fileURLToPath(outDir),
  trailingSlash: 'never',
  devToolbar: {
    enabled: false,
  },
  integrations: [
    mdx(),
    svelte(),
    sitemap({
      filter: (page) => !new URL(page).pathname.replace(/\.html$/, '').endsWith('/intutive_model_theory'),
      async serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/' && !/\.[^/]+$/.test(url.pathname)) url.pathname += '.html';
        const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const html = await readFile(new URL(file, outDir), 'utf8');
        // Unlisted posts are reachable by link, but not advertised to search engines.
        if (/<meta\b[^>]*name="robots"[^>]*content="noindex"/i.test(html)) return undefined;
        return { ...item, url: url.href };
      },
    }),
    contentResources(),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath, remarkCodeFile, remarkAnimation, remarkMedia,
      // Astro caches rendered Markdown. Bump this when proof parsing changes so
      // unchanged posts are re-rendered with the updated plugin, including in dev.
      [remarkProof, { cacheVersion: 2 }],
    ],
    rehypePlugins: [[rehypeKatex, { macros: katexMacros }]],
    shikiConfig: {
      theme: 'github-light',
      wrap: false,
    },
  },
  build: {
    format: 'file',
    inlineStylesheets: 'never',
  },
});
