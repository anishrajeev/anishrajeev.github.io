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
const sitemap = await read('sitemap-0.xml');
const otherIndex = await read('posts.html');
const modelTheoryLink = 'href="https://functor.network/user/3255/entry/1404"';
for (const listing of [index, otherIndex]) {
  assert.equal(listing.split(modelTheoryLink).length - 1, 1, 'External model theory link must appear exactly once');
  assert.ok(listing.indexOf(modelTheoryLink) < listing.indexOf('href="/posts/trip_report_s25.html"'), 'External post must respect newest-first ordering');
  assert.ok(!listing.includes('href="/posts/intuitive-model-theory.html"'), 'Local model theory draft must remain unpublished');
}
await assert.rejects(stat(path.join(output, 'posts/model-theory-external.html')), { code: 'ENOENT' });
assert.ok(!sitemap.includes('model-theory-external'), 'External entries should not create local sitemap pages');
for (const file of await readdir(path.join(output, 'posts'))) {
  if (!file.endsWith('.html')) continue;
  const html = await read(`posts/${file}`);
  if (!/<meta\b[^>]*name="robots"[^>]*content="noindex"/i.test(html)) continue;
  const url = `/posts/${file}`;
  assert.ok(!index.includes(`href="${url}"`) && !otherIndex.includes(`href="${url}"`), `${url} leaked into a public index`);
  assert.ok(!sitemap.includes(url), `${url} leaked into the sitemap`);
}
assert.equal((await read('CNAME')).trim(), 'anish.ink');
assert.ok((await stat(path.join(output, 'resume.pdf'))).isFile());
// Functor Network embeds this exact URL. Preserve it even while the local post is a draft.
const stoneSpacePath = 'resources/functor_network/model_theory_stone_space_drawing.png';
const stoneSpaceImage = await readFile(path.join(output, stoneSpacePath));
assert.deepEqual(stoneSpaceImage.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'Hosted Stone Space resource must be a PNG');
assert.deepEqual(stoneSpaceImage, await readFile(path.join('public', stoneSpacePath)), 'Build must preserve the externally embedded Stone Space image');
await assert.rejects(stat(path.join(output, 'rss.xml')), { code: 'ENOENT' });
await read('index.html');
await read('posts.html');
await read('404.html');
console.log('Build checks passed: three migrated posts, date order, no draft labels or orphan raw resources, zero post JS, scrollable code, legacy URLs, externally embedded image, CNAME, résumé, and no RSS.');
