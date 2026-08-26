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

async function walk(directory, pattern) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(filename, pattern));
    else if (pattern.test(entry.name)) found.push(filename);
  }
  return found;
}

function animationOptions(raw = '') {
  return {
    scene: raw.match(/(?:^|\s)--scene\s+([\w.]+)(?=\s|$)/)?.[1] ?? null,
    quality: raw.match(/(?:^|\s)--quality\s+([lmh])(?=\s|$)/)?.[1] ?? 'm',
  };
}

async function validateAnimations(postsRoot) {
  for (const markdownPath of await walk(postsRoot, /index\.mdx?$/)) {
    const markdown = await readFile(markdownPath, 'utf8');
    const frontmatter = markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
    if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    const postRoot = path.dirname(markdownPath);
    const resourcesRoot = path.join(postRoot, 'resources');
    const manifest = JSON.parse(await readFile(path.join(resourcesRoot, 'animations.json'), 'utf8').catch(() => '{"entries":{}}'));
    for (const match of markdown.matchAll(/^#animation\s+(\S+)(?:\s+(.*))?$/gm)) {
      const options = animationOptions(match[2]);
      const sourcePath = path.resolve(postRoot, match[1]);
      const source = await readFile(sourcePath).catch(() => null);
      const relative = path.relative(resourcesRoot, sourcePath).split(path.sep).join('/');
      const key = `${relative}|scene=${options.scene ?? ''}|quality=${options.quality}`;
      const entry = manifest.entries?.[key];
      const sourceHash = source && createHash('sha256').update(source).digest('hex');
      const valid = sourceHash && entry?.sourceHash === sourceHash
        && (await stat(path.join(resourcesRoot, entry.webm ?? '')).catch(() => null))?.isFile()
        && (await stat(path.join(resourcesRoot, entry.poster ?? '')).catch(() => null))?.isFile();
      if (!valid) {
        console.error(`Missing rendered animation for ${match[1]}. Run \`npm run anim\` locally and commit the output.`);
        process.exit(1);
      }
    }
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
          const resources = path.join(postsRoot, post.name, 'resources');
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
      'astro:build:start': async () => {
        await validateAnimations(postsRoot);
      },
    },
  };
}
