import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new -- "The Fundamental Group"');
  process.exit(1);
}

const slug = title
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

if (!slug) {
  console.error('The title must contain at least one letter or number.');
  process.exit(1);
}

const postRoot = path.resolve('src', 'content', 'posts', slug);
const now = new Date();
const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

try {
  await mkdir(postRoot);
} catch (error) {
  if (error?.code === 'EEXIST') {
    console.error(`Refusing to overwrite existing post: ${postRoot}`);
    process.exit(1);
  }
  throw error;
}

await mkdir(path.join(postRoot, 'resources'));
await writeFile(path.join(postRoot, 'resources', '.gitkeep'), '');
await writeFile(path.join(postRoot, 'index.md'), `---
title: ${JSON.stringify(title)}
date: ${date}
status: draft
math: false
---

Start writing here.
`);

console.log(path.join(postRoot, 'index.md'));
