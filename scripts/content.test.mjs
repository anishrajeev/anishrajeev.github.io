import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import contentResources, { validateAnimationAssets, validateRenderedAnimations } from '../plugins/content-resources.mjs';
import remarkAnimation from '../plugins/remark-animation.mjs';
import { isPostVisible } from '../plugins/post-visibility.mjs';

test('KaTeX stylesheet and math renderer use the same version', () => {
  const require = createRequire(import.meta.url);
  const rendererRequire = createRequire(require.resolve('rehype-katex'));
  assert.equal(require('katex/package.json').version, rendererRequire('katex/package.json').version);
});

test('published posts show everywhere, drafts only in dev, stale nowhere', () => {
  assert.equal(isPostVisible('published', false), true);
  assert.equal(isPostVisible('published', true), true);
  assert.equal(isPostVisible('draft', false), true);
  assert.equal(isPostVisible('draft', true), false);
  assert.equal(isPostVisible('stale', false), false);
  assert.equal(isPostVisible('stale', true), false);
  assert.equal(isPostVisible(undefined, true), false);
});

// Fixtures live outside the repository. These tests never remove project directories.
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'anish-content-test-'));
  const posts = path.join(root, 'src/content/posts');
  const output = path.join(root, 'dist');
  await mkdir(path.join(output, 'posts'), { recursive: true });
  for (const slug of ['published', 'draft', 'stale']) {
    await mkdir(path.join(posts, slug, 'resources'), { recursive: true });
  }
  return { root, posts, output };
}

const paragraph = (value) => ({ type: 'paragraph', children: [{ type: 'text', value }] });

test('missing source is a dev placeholder and fails production validation clearly', async () => {
  const { posts } = await fixture();
  const tree = { children: [paragraph('#animation ./resources/loop.py')] };
  await remarkAnimation()(tree, { path: path.join(posts, 'draft/index.md') });
  assert.match(tree.children[0].value, /Animation not rendered yet/);
  assert.throws(() => validateRenderedAnimations(tree.children[0].value, 'published'), /Missing rendered animation.*Run `npm run anim` locally/);
});

test('code fences, inline code, and multi-line paragraphs are not animations', async () => {
  const { posts } = await fixture();
  const tree = { children: [
    { type: 'code', value: '#animation ./resources/example.py' },
    { type: 'paragraph', children: [{ type: 'inlineCode', value: '#animation ./resources/example.py' }] },
    paragraph('Example:\n#animation ./resources/example.py'),
  ] };
  const before = structuredClone(tree);
  await remarkAnimation()(tree, { path: path.join(posts, 'published/index.md') });
  assert.deepEqual(tree, before);
  assert.doesNotThrow(() => validateRenderedAnimations('<pre><code>#animation ./resources/example.py</code></pre>', 'published'));
});

test('cached animations render inline with dimensions; later videos do not preload', async () => {
  const { posts } = await fixture();
  const resources = path.join(posts, 'published/resources');
  const source = 'class Loop(Scene): pass';
  await writeFile(path.join(resources, 'loop.py'), source);
  await writeFile(path.join(resources, 'loop.12345678.webm'), 'fixture');
  await writeFile(path.join(resources, 'loop.12345678.jpg'), 'fixture');
  await writeFile(path.join(resources, 'animations.json'), JSON.stringify({ entries: {
    'loop.py|scene=|quality=m': {
      sourceHash: createHash('sha256').update(source).digest('hex'),
      webm: 'loop.12345678.webm', poster: 'loop.12345678.jpg', width: 800, height: 450,
    },
  } }));
  const tree = { children: [paragraph('#animation ./resources/loop.py'), paragraph('#animation ./resources/loop.py')] };
  const file = { path: path.join(posts, 'published/index.md') };
  await remarkAnimation()(tree, file);
  assert.match(tree.children[0].value, /playsinline preload="metadata"/);
  assert.match(tree.children[0].value, /width="800" height="450"/);
  assert.match(tree.children[1].value, /preload="none"/);
  assert.doesNotThrow(() => validateRenderedAnimations(tree.children[0].value, 'published'));
  await validateAnimationAssets(tree.children[0].value, resources);

  await writeFile(path.join(resources, 'loop.py'), `${source}\n# changed`);
  await assert.rejects(validateAnimationAssets(tree.children[0].value, resources), /Missing rendered animation/);
  const changed = { children: [paragraph('#animation ./resources/loop.py')] };
  await remarkAnimation()(changed, file);
  assert.throws(() => validateRenderedAnimations(changed.children[0].value, 'published'), /Missing rendered animation/);
});

test('animation sources cannot escape the post resources', async () => {
  const { posts } = await fixture();
  const tree = { children: [paragraph('#animation ../../private.py')] };
  await assert.rejects(remarkAnimation()(tree, { path: path.join(posts, 'published/index.md') }), /must stay inside/);
});

test('only generated posts have raw resources copied into production', async () => {
  const { root, posts, output } = await fixture();
  for (const slug of ['published', 'draft', 'stale']) {
    await writeFile(path.join(posts, slug, 'resources/example.scm'), '(define x 1)');
    await writeFile(path.join(posts, slug, 'resources/loop.12345678.webm'), 'fixture');
  }
  await writeFile(path.join(output, 'posts/published.html'), '<p>A published post.</p>');
  const integration = contentResources();
  integration.hooks['astro:config:setup']({ config: { root: pathToFileURL(`${root}/`) }, updateConfig() {} });
  await integration.hooks['astro:build:done']({ dir: pathToFileURL(`${output}/`) });
  assert.equal(await readFile(path.join(output, 'raw/published/example.scm'), 'utf8'), '(define x 1)');
  assert.ok((await stat(path.join(output, 'anim/published/loop.12345678.webm'))).isFile());
  for (const slug of ['draft', 'stale']) {
    for (const prefix of ['raw', 'anim']) {
      await assert.rejects(stat(path.join(output, prefix, slug)), { code: 'ENOENT' });
    }
  }
});

test('build hook rejects a published missing animation', async () => {
  const { root, output } = await fixture();
  await writeFile(path.join(output, 'posts/published.html'), '<aside data-animation-source="./resources/loop.py">Not rendered</aside>');
  const integration = contentResources();
  integration.hooks['astro:config:setup']({ config: { root: pathToFileURL(`${root}/`) }, updateConfig() {} });
  await assert.rejects(integration.hooks['astro:build:done']({ dir: pathToFileURL(`${output}/`) }), /Missing rendered animation/);
});
