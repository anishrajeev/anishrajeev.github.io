import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import contentResources from './plugins/content-resources.mjs';
import remarkAnimation from './plugins/remark-animation.mjs';
import remarkCodeFile from './plugins/remark-code-file.mjs';
import remarkMedia from './plugins/remark-media.mjs';
import katexMacros from './src/styles/katex-macros.js';

export default defineConfig({
  site: 'https://anish.ink',
  trailingSlash: 'never',
  devToolbar: {
    enabled: false,
  },
  integrations: [
    mdx(),
    svelte(),
    sitemap({
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/' && !/\.[^/]+$/.test(url.pathname)) url.pathname += '.html';
        return { ...item, url: url.href };
      },
    }),
    contentResources(),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkCodeFile, remarkAnimation, remarkMedia],
    rehypePlugins: [[rehypeKatex, { macros: katexMacros }]],
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  build: {
    format: 'file',
    inlineStylesheets: 'never',
  },
});
