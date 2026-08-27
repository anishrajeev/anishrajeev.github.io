import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('dist');
const read = (file) => readFile(path.join(output, file), 'utf8');

const published = ['trip_report_s25', 'ycombinator', 'optimization'];
const index = await read('posts/posts.html');
let previous = -1;
for (const slug of published) {
  const html = await read(`posts/${slug}.html`);
  assert.ok(html.includes('<h1'), `Missing post content for ${slug}`);
  assert.ok(!/<script\b/i.test(html), `Unexpected JavaScript on ${slug}`);
  const position = index.indexOf(`href="/posts/${slug}.html"`);
  assert.ok(position > previous, `${slug} missing or not in newest-first order`);
  previous = position;
}

assert.ok(!index.includes('class="draft-label"'), 'A draft leaked into the public index');
for (const prefix of ['raw', 'anim']) {
  const entries = await readdir(path.join(output, prefix)).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const slug of entries) {
    assert.ok((await stat(path.join(output, 'posts', `${slug}.html`))).isFile(), `${slug} has resources but no public page`);
  }
}

const ycombinator = await read('posts/ycombinator.html');
assert.match(ycombinator, /class="astro-code/);
assert.ok(!ycombinator.includes('white-space: pre-wrap'), 'Code blocks must scroll, not wrap');
const redirect = (await read('posts/intutive_model_theory.html')).match(/url=(\/posts\/[^"<>]+\.html)/)?.[1];
assert.ok(redirect, 'Legacy model theory redirect is missing');
await read(redirect.slice(1));
assert.ok(!(await read('sitemap-0.xml')).includes('intutive_model_theory'), 'Redirect should not be indexed');
assert.equal((await read('CNAME')).trim(), 'anish.ink');
assert.ok((await stat(path.join(output, 'resume.pdf'))).isFile());
await assert.rejects(stat(path.join(output, 'rss.xml')), { code: 'ENOENT' });
await read('index.html');
await read('posts.html');
await read('404.html');
console.log('Build checks passed: three migrated posts, date order, no draft labels or orphan raw resources, zero post JS, scrollable code, legacy URLs, CNAME, résumé, and no RSS.');
