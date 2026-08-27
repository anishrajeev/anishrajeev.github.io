import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = {
  '.c': 'text/plain; charset=utf-8', '.cc': 'text/plain; charset=utf-8', '.cpp': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.gif': 'image/gif', '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.ml': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4', '.png': 'image/png', '.py': 'text/x-python; charset=utf-8', '.scm': 'text/plain; charset=utf-8',
  '.sh': 'text/x-shellscript; charset=utf-8', '.sml': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.ts': 'text/plain; charset=utf-8', '.webm': 'video/webm', '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8',
};
const RAW_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.css', '.go', '.hs', '.html', '.java', '.js', '.json', '.md',
  '.mjs', '.ml', '.py', '.rb', '.rs', '.scm', '.sh', '.sml', '.sql', '.svg', '.ts', '.tsx',
  '.xml', '.yaml', '.yml',
]);

function safeParts(urlPath) {
  try {
    const parts = urlPath.split('/').filter(Boolean).map(decodeURIComponent);
    return parts.every((part) => part !== '.' && part !== '..' && !part.includes(path.sep)) ? parts : null;
  } catch { return null; }
}

async function findAnimation(postsRoot, slug, filename) {
  const candidate = path.join(postsRoot, slug, 'resources', filename);
  return (await stat(candidate).catch(() => null))?.isFile() ? candidate : null;
}

// Validate rendered pages, not Markdown source: fenced examples are not directives,
// and draft/stale posts are not part of the production site.
export function validateRenderedAnimations(html, slug) {
  const missing = html.match(/<aside\b[^>]*\bdata-animation-source="([^"]*)"/);
  if (missing) {
    throw new Error(`Missing rendered animation for ${missing[1]} (${slug}). Run \`npm run anim\` locally and commit the output.`);
  }
}

export async function validateAnimationAssets(html, resources) {
  const videos = [...html.matchAll(/<video\b[^>]*data-animation-key="([^"]+)"[^>]*>[\s\S]*?<\/video>/g)];
  if (!videos.length) return;
  const manifest = JSON.parse(await readFile(path.join(resources, 'animations.json'), 'utf8').catch(() => '{"entries":{}}'));
  // Markdown may have been cached since the Python source last changed. Always
  // recheck the actual files at build time, even if rendering reused cached HTML.
  for (const [video, encodedKey] of videos) {
    const key = decodeURIComponent(encodedKey);
    const relative = key.slice(0, key.lastIndexOf('|scene='));
    const sourcePath = path.resolve(resources, relative);
    if (!sourcePath.startsWith(`${resources}${path.sep}`)) throw new Error('Animation source must stay inside its post resources.');
    const source = await readFile(sourcePath).catch(() => null);
    const entry = manifest.entries?.[key];
    const valid = source && entry?.sourceHash === createHash('sha256').update(source).digest('hex')
      && (await stat(path.join(resources, entry.webm ?? '')).catch(() => null))?.isFile()
      && (await stat(path.join(resources, entry.poster ?? '')).catch(() => null))?.isFile()
      && video.includes(`/${encodeURIComponent(entry.webm)}"`)
      && video.includes(`/${encodeURIComponent(entry.poster)}"`);
    if (!valid) throw new Error(`Missing rendered animation for ./resources/${relative}. Run \`npm run anim\` locally and commit the output.`);
  }
}

export default function contentResources() {
  let root;
  let postsRoot;
  return {
    name: 'content-resources',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        root = fileURLToPath(config.root);
        postsRoot = path.join(root, 'src', 'content', 'posts');
        updateConfig({
          vite: {
            plugins: [{
              name: 'content-resources-dev',
              configureServer(server) {
                server.middlewares.use(async (request, response, next) => {
                  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
                  const raw = pathname.match(/^\/raw\/([^/]+)\/(.+)$/);
                  const anim = pathname.match(/^\/anim\/([^/]+)\/([^/]+)$/);
                  const parts = safeParts(pathname);
                  let filename = null;
                  if (raw && parts) filename = path.join(postsRoot, ...parts.slice(1, 2), 'resources', ...parts.slice(2));
                  if (anim && parts) filename = await findAnimation(postsRoot, parts[1], parts[2]);
                  if (!filename || !filename.startsWith(postsRoot)) return next();
                  const info = await stat(filename).catch(() => null);
                  if (!info?.isFile()) return next();
                  response.statusCode = 200;
                  response.setHeader('Content-Type', MIME[path.extname(filename).toLowerCase()] ?? 'application/octet-stream');
                  response.end(await readFile(filename));
                });
              },
            }],
          },
        });
      },
      'astro:build:done': async ({ dir }) => {
        const output = fileURLToPath(dir);
        const posts = await readdir(postsRoot, { withFileTypes: true }).catch(() => []);
        for (const post of posts.filter((entry) => entry.isDirectory())) {
          // The generated page is the source of truth for publication. Never ship
          // raw code or animation files belonging to draft/stale posts.
          const html = await readFile(path.join(output, 'posts', `${post.name}.html`), 'utf8').catch((error) => {
            if (error.code === 'ENOENT') return null;
            throw error;
          });
          if (html === null) continue;
          validateRenderedAnimations(html, post.name);
          const resources = path.join(postsRoot, post.name, 'resources');
          await validateAnimationAssets(html, resources);
          if (!(await stat(resources).catch(() => null))?.isDirectory()) continue;
          const entries = await readdir(resources, { recursive: true, withFileTypes: true });
          const rawTarget = path.join(output, 'raw', post.name);
          const animationTarget = path.join(output, 'anim', post.name);
          for (const entry of entries) {
            if (!entry.isFile()) continue;
            const source = path.join(entry.parentPath, entry.name);
            const relative = path.relative(resources, source);
            const extension = path.extname(entry.name).toLowerCase();
            if (RAW_EXTENSIONS.has(extension)) {
              await mkdir(path.dirname(path.join(rawTarget, relative)), { recursive: true });
              await cp(source, path.join(rawTarget, relative));
            }
            if (['.webm', '.jpg'].includes(extension) && /\.[a-f0-9]{8}\.(?:webm|jpg)$/.test(entry.name)) {
              await mkdir(path.dirname(path.join(animationTarget, relative)), { recursive: true });
              await cp(source, path.join(animationTarget, relative));
            }
          }
        }
      },
    },
  };
}
