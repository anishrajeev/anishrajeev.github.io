import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const postsRoot = path.resolve('src', 'content', 'posts');
const watchMode = process.argv.includes('--watch');

function commandVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return result.status === 0 ? `${result.stdout}${result.stderr}`.trim().split(/\r?\n/)[0] : null;
}

const manimVersion = commandVersion('manim');
if (!manimVersion) {
  console.error(`Manim is not installed or is not on PATH.

Install Manim using the official instructions for your platform:
  https://docs.manim.community/en/stable/installation.html

Then confirm that \`manim --version\` works and run \`npm run anim\` again.`);
  process.exit(1);
}
if (!commandVersion('ffmpeg') || !commandVersion('ffprobe')) {
  console.error('ffmpeg and ffprobe are required to render animation posters. Install ffmpeg, then run `npm run anim` again.');
  process.exit(1);
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

function discoverScenes(source) {
  const scenes = [];
  const pattern = /^\s*class\s+([A-Za-z_]\w*)\s*\(([^)]*\bScene\b[^)]*)\)\s*:/gm;
  for (const match of source.matchAll(pattern)) scenes.push(match[1]);
  return scenes;
}

async function walk(directory, extensionPattern) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(filename, extensionPattern));
    else if (extensionPattern.test(entry.name)) found.push(filename);
  }
  return found;
}

async function collectDirectives() {
  const markdownFiles = await walk(postsRoot, /index\.mdx?$/);
  const directives = [];
  for (const markdownPath of markdownFiles) {
    const source = await readFile(markdownPath, 'utf8');
    const postRoot = path.dirname(markdownPath);
    const resourcesRoot = path.join(postRoot, 'resources');
    for (const match of source.matchAll(/^#animation\s+(\S+)(?:\s+(.*))?$/gm)) {
      const options = parseOptions(match[2]);
      const scriptPath = path.resolve(postRoot, match[1]);
      if (!scriptPath.startsWith(`${resourcesRoot}${path.sep}`)) throw new Error(`#animation path must stay inside ${resourcesRoot}`);
      directives.push({ postRoot, resourcesRoot, scriptPath, relative: path.relative(resourcesRoot, scriptPath).split(path.sep).join('/'), options });
    }
  }
  return directives;
}

async function findFirst(directory, extension) {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  const match = entries.find((entry) => entry.isFile() && entry.name.endsWith(extension));
  return match ? path.join(match.parentPath, match.name) : null;
}

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${label} failed.\n${result.stdout}\n${result.stderr}`.trim());
  }
}

async function renderOne(item) {
  const python = await readFile(item.scriptPath);
  const sourceHash = createHash('sha256').update(python).digest('hex');
  const text = python.toString('utf8');
  const scenes = discoverScenes(text);
  const scene = item.options.scene ?? (scenes.length === 1 ? scenes[0] : null);
  if (!scene) {
    throw new Error(scenes.length === 0
      ? `No Scene subclass was found in ${item.scriptPath}. Add --scene NAME if it is imported.`
      : `Several Scene subclasses were found in ${item.scriptPath}: ${scenes.join(', ')}. Add --scene NAME.`);
  }
  const key = `${item.relative}|scene=${item.options.scene ?? ''}|quality=${item.options.quality}`;
  const digest = createHash('sha256')
    .update(python)
    .update(JSON.stringify({ scene, quality: item.options.quality }))
    .update(manimVersion)
    .digest('hex');
  const hash8 = digest.slice(0, 8);
  const base = path.basename(item.scriptPath, path.extname(item.scriptPath));
  const webm = `${base}.${hash8}.webm`;
  const poster = `${base}.${hash8}.jpg`;
  const webmPath = path.join(item.resourcesRoot, webm);
  const posterPath = path.join(item.resourcesRoot, poster);
  const manifestPath = path.join(item.resourcesRoot, 'animations.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{"version":1,"entries":{}}'));
  const cached = manifest.entries?.[key];
  if (cached?.sourceHash === sourceHash
      && cached.manimVersion === manimVersion
      && cached.scene === scene
      && cached.quality === item.options.quality
      && cached.webm === webm
      && cached.poster === poster
      && await stat(webmPath).catch(() => null)
      && await stat(posterPath).catch(() => null)) {
    console.log(`cache hit  ${path.relative(process.cwd(), item.scriptPath)} (${scene}, q${item.options.quality})`);
    return;
  }

  const started = performance.now();
  const temp = await mkdtemp(path.join(os.tmpdir(), 'anish-anim-'));
  try {
    run('manim', ['render', `-q${item.options.quality}`, '--format=webm', `--media_dir=${temp}`, `--output_file=${base}`, item.scriptPath, scene], `Manim render for ${item.relative}`);
    const rendered = await findFirst(temp, '.webm');
    if (!rendered) throw new Error(`Manim completed but did not produce a .webm for ${item.relative}.`);
    await cp(rendered, webmPath);
    let posterResult = spawnSync('ffmpeg', ['-y', '-ss', '1', '-i', webmPath, '-frames:v', '1', '-q:v', '2', posterPath], { encoding: 'utf8' });
    if (posterResult.status !== 0) {
      posterResult = spawnSync('ffmpeg', ['-y', '-ss', '0.1', '-i', webmPath, '-frames:v', '1', '-q:v', '2', posterPath], { encoding: 'utf8' });
    }
    if (posterResult.status !== 0) throw new Error(`ffmpeg could not extract a poster for ${item.relative}.\n${posterResult.stderr}`);
    const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', webmPath], { encoding: 'utf8' });
    if (probe.status !== 0) throw new Error(`ffprobe could not read ${webm}.\n${probe.stderr}`);
    const dimensions = JSON.parse(probe.stdout).streams?.[0];
    if (!dimensions?.width || !dimensions?.height) throw new Error(`Could not determine dimensions for ${webm}.`);
    manifest.version = 1;
    manifest.entries ??= {};
    manifest.entries[key] = {
      sourceHash, manimVersion, scene, quality: item.options.quality,
      webm, poster, width: dimensions.width, height: dimensions.height,
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`rendered   ${path.relative(process.cwd(), item.scriptPath)} in ${((performance.now() - started) / 1000).toFixed(2)}s`);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

let running = false;
let queued = false;
async function renderAll() {
  if (running) { queued = true; return; }
  running = true;
  try {
    const directives = await collectDirectives();
    if (directives.length === 0) console.log('No #animation directives found.');
    for (const directive of directives) await renderOne(directive);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    if (!watchMode) process.exitCode = 1;
  } finally {
    running = false;
    if (queued) { queued = false; await renderAll(); }
  }
}

await renderAll();

if (watchMode) {
  console.log('Watching post Markdown and resources for animation changes…');
  let timer;
  const watcher = (await import('node:fs')).watch(postsRoot, { recursive: true }, (_event, filename) => {
    if (!filename || !/\.(?:py|md|mdx)$/.test(filename)) return;
    clearTimeout(timer);
    timer = setTimeout(renderAll, 250);
  });
  process.on('SIGINT', () => { watcher.close(); process.exit(0); });
}
