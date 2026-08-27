import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIRECTIVE = /^#animation\s+(\S+)(?:\s+(.*))?$/;

function paragraphText(node) {
  return node?.type === 'paragraph' && node.children?.length === 1 && node.children[0].type === 'text'
    ? node.children[0].value
    : null;
}

function parseOptions(raw = '') {
  const scene = raw.match(/(?:^|\s)--scene\s+([\w.]+)(?=\s|$)/)?.[1] ?? null;
  const quality = raw.match(/(?:^|\s)--quality\s+([lmh])(?=\s|$)/)?.[1] ?? 'm';
  const consumed = raw
    .replace(/(?:^|\s)--scene\s+[\w.]+(?=\s|$)/, '')
    .replace(/(?:^|\s)--quality\s+[lmh](?=\s|$)/, '')
    .trim();
  if (consumed) throw new Error(`Unknown #animation option: ${consumed}`);
  return { scene, quality };
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

async function exists(filename) {
  try { await access(filename); return true; } catch { return false; }
}

export default function remarkAnimation() {
  return async (tree, file) => {
    const markdownPath = file.path ? path.resolve(String(file.path)) : null;
    if (!markdownPath) return;
    const normalized = markdownPath.split(path.sep).join('/');
    const postMatch = normalized.match(/\/src\/content\/posts\/([^/]+)\/index\.mdx?$/);
    if (!postMatch) return;
    const slug = postMatch[1];
    const postRoot = path.dirname(markdownPath);
    const resourcesRoot = path.resolve(postRoot, 'resources');
    const manifestPath = path.join(resourcesRoot, 'animations.json');
    let manifest = { version: 1, entries: {} };
    if (await exists(manifestPath)) manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    let animationIndex = 0;

    for (let index = 0; index < tree.children.length; index += 1) {
      const value = paragraphText(tree.children[index]);
      const match = value?.match(DIRECTIVE);
      if (!match) continue;
      const options = parseOptions(match[2]);
      const sourcePath = path.resolve(postRoot, match[1]);
      if (sourcePath !== resourcesRoot && !sourcePath.startsWith(`${resourcesRoot}${path.sep}`)) {
        throw new Error(`#animation path must stay inside this post's resources folder: ${match[1]}`);
      }
      const source = await readFile(sourcePath);
      const sourceHash = createHash('sha256').update(source).digest('hex');
      const relative = path.relative(resourcesRoot, sourcePath).split(path.sep).join('/');
      const key = `${relative}|scene=${options.scene ?? ''}|quality=${options.quality}`;
      const entry = manifest.entries?.[key];
      const valid = entry && entry.sourceHash === sourceHash
        && await exists(path.join(resourcesRoot, entry.webm))
        && await exists(path.join(resourcesRoot, entry.poster));

      if (!valid) {
        tree.children[index] = {
          type: 'html',
          value: `<aside class="animation-missing"><strong>Animation not rendered yet.</strong><br>Run <code>npm run anim</code> to render <code>${escapeHtml(match[1])}</code>.</aside>`,
        };
        continue;
      }

      const preload = animationIndex === 0 ? 'metadata' : 'none';
      const assetBase = `/anim/${encodeURIComponent(slug)}/`;
      tree.children[index] = {
        type: 'html',
        value: `<figure class="animation"><video autoplay muted loop playsinline preload="${preload}" poster="${assetBase}${encodeURIComponent(entry.poster)}" width="${entry.width}" height="${entry.height}"><source src="${assetBase}${encodeURIComponent(entry.webm)}" type="video/webm"></video><img class="animation__reduced" src="${assetBase}${encodeURIComponent(entry.poster)}" alt="Animation poster frame" width="${entry.width}" height="${entry.height}"></figure>`,
      };
      animationIndex += 1;
    }
  };
}
