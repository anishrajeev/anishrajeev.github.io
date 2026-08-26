import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIRECTIVE = /^#code\s+(\S+)(?:\s+(.*))?$/;
const LANGUAGE_BY_EXTENSION = {
  '.c': 'c', '.cc': 'cpp', '.cpp': 'cpp', '.css': 'css', '.go': 'go',
  '.hs': 'haskell', '.html': 'html', '.java': 'java', '.js': 'javascript',
  '.json': 'json', '.md': 'markdown', '.ml': 'ocaml', '.mjs': 'javascript',
  '.py': 'python', '.rb': 'ruby', '.rs': 'rust', '.scm': 'scheme',
  '.sh': 'bash', '.sml': 'sml', '.sql': 'sql', '.svg': 'xml', '.ts': 'typescript',
  '.tsx': 'tsx', '.xml': 'xml', '.yaml': 'yaml', '.yml': 'yaml',
};

function paragraphText(node) {
  return node?.type === 'paragraph' && node.children?.length === 1 && node.children[0].type === 'text'
    ? node.children[0].value
    : null;
}

function parseOptions(raw = '') {
  const lines = raw.match(/(?:^|\s)--lines\s+(\d+)-(\d+)(?=\s|$)/);
  const region = raw.match(/(?:^|\s)--region\s+([\w.-]+)(?=\s|$)/);
  const consumed = raw
    .replace(/(?:^|\s)--lines\s+\d+-\d+(?=\s|$)/, '')
    .replace(/(?:^|\s)--region\s+[\w.-]+(?=\s|$)/, '')
    .trim();
  if (consumed) throw new Error(`Unknown #code option: ${consumed}`);
  if (lines && region) throw new Error('#code accepts either --lines or --region, not both.');
  return {
    lines: lines ? [Number(lines[1]), Number(lines[2])] : null,
    region: region?.[1] ?? null,
  };
}

function extractRegion(source, name, filename) {
  const rows = source.split(/\r?\n/);
  const marker = new RegExp(`^\\s*(?:#|//|;)\\s*region:\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
  const end = /^\s*(?:#|\/\/|;)\s*endregion\s*$/;
  const startIndex = rows.findIndex((row) => marker.test(row));
  if (startIndex === -1) throw new Error(`Region "${name}" was not found in ${filename}.`);
  const endOffset = rows.slice(startIndex + 1).findIndex((row) => end.test(row));
  if (endOffset === -1) throw new Error(`Region "${name}" in ${filename} has no endregion marker.`);
  return rows.slice(startIndex + 1, startIndex + 1 + endOffset).join('\n');
}

function postInfo(markdownPath) {
  const normalized = markdownPath.split(path.sep).join('/');
  const match = normalized.match(/\/src\/content\/posts\/([^/]+)\/index\.mdx?$/);
  if (!match) throw new Error('#code can only be used inside src/content/posts/<slug>/index.md or index.mdx.');
  return { slug: match[1], root: path.dirname(markdownPath) };
}

export default function remarkCodeFile() {
  return async (tree, file) => {
    const markdownPath = file.path ? path.resolve(String(file.path)) : null;
    if (!markdownPath) return;
    const replacements = [];

    for (let index = 0; index < tree.children.length; index += 1) {
      const value = paragraphText(tree.children[index]);
      const match = value?.match(DIRECTIVE);
      if (!match) continue;
      const options = parseOptions(match[2]);
      const { slug, root } = postInfo(markdownPath);
      const resourcePath = path.resolve(root, match[1]);
      const resourcesRoot = path.resolve(root, 'resources');
      if (resourcePath !== resourcesRoot && !resourcePath.startsWith(`${resourcesRoot}${path.sep}`)) {
        throw new Error(`#code path must stay inside this post's resources folder: ${match[1]}`);
      }
      let source = await readFile(resourcePath, 'utf8');
      if (options.lines) {
        const [start, end] = options.lines;
        const rows = source.split(/\r?\n/);
        if (start < 1 || end < start || end > rows.length) {
          throw new Error(`Invalid line range ${start}-${end} for ${match[1]} (${rows.length} lines).`);
        }
        source = rows.slice(start - 1, end).join('\n');
      } else if (options.region) {
        source = extractRegion(source, options.region, match[1]);
      }
      const relative = path.relative(resourcesRoot, resourcePath).split(path.sep).join('/');
      replacements.push({
        index,
        nodes: [
          {
            type: 'code',
            lang: LANGUAGE_BY_EXTENSION[path.extname(resourcePath).toLowerCase()] ?? 'text',
            value: source.replace(/\n$/, ''),
          },
          {
            type: 'html',
            value: `<p class="code-source"><a href="/raw/${encodeURIComponent(slug)}/${relative.split('/').map(encodeURIComponent).join('/')}">view raw ${path.basename(resourcePath)}</a></p>`,
          },
        ],
      });
    }

    for (const replacement of replacements.reverse()) {
      tree.children.splice(replacement.index, 1, ...replacement.nodes);
    }
  };
}
