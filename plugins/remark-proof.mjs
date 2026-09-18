const START = /^#proof-hidden(?:[\t ]+(.+))?$/;
const END = '#end-proof';

function paragraphText(node) {
  return node?.type === 'paragraph' && node.children?.length === 1 && node.children[0].type === 'text'
    ? node.children[0].value
    : null;
}

// Markdown merges consecutive lines into one paragraph (including inside lists).
// Split only at directive lines, keeping the existing parsed inline nodes intact.
function splitParagraph(node) {
  if (node.type !== 'paragraph') return [node];
  const lines = [[]];
  for (const child of node.children) {
    if (child.type !== 'text') {
      lines.at(-1).push(child);
      continue;
    }
    child.value.split('\n').forEach((value, index) => {
      if (index) lines.push([]);
      if (value) lines.at(-1).push({ ...child, value });
    });
  }
  const result = [];
  let children = [];
  const flush = () => {
    if (children.length) result.push({ type: 'paragraph', children });
    children = [];
  };
  for (const line of lines) {
    const value = line.length === 1 && line[0].type === 'text' ? line[0].value.trim() : null;
    if (value === END || (value && START.test(value))) {
      flush();
      result.push({ type: 'paragraph', children: [{ type: 'text', value }] });
    } else {
      if (children.length) children.push({ type: 'text', value: '\n' });
      children.push(...line);
    }
  }
  flush();
  return result;
}

function element(name, children, mdx, className) {
  if (mdx) return {
    type: 'mdxJsxFlowElement', name,
    attributes: className ? [{ type: 'mdxJsxAttribute', name: 'className', value: className }] : [],
    children,
  };
  return {
    type: 'proofElement',
    data: { hName: name, hProperties: className ? { className: [className] } : {} },
    children,
  };
}

export default function remarkProof() {
  return (tree, file) => {
    const mdx = /\.mdx$/.test(String(file?.path ?? ''));
    function transform(parent) {
      // Do not interpret directives in fenced code or inline code/math.
      if (!['root', 'list', 'listItem', 'blockquote', 'mdxJsxFlowElement'].includes(parent.type)) return;
      const output = [];
      let proof = null;
      for (const node of parent.children.flatMap(splitParagraph)) {
        const value = paragraphText(node);
        const start = value?.match(START);
        if (start) {
          if (proof) throw new Error('A #proof-hidden block cannot be nested inside another proof.');
          proof = { label: start[1]?.trim() || 'Proof', children: [] };
        } else if (value === END) {
          if (!proof) throw new Error('#end-proof has no matching #proof-hidden in this list item or block.');
          output.push(element('details', [
            element('summary', [{ type: 'text', value: proof.label }], mdx),
            element('div', proof.children, mdx, 'proof-hidden__body'),
          ], mdx, 'proof-hidden'));
          proof = null;
        } else {
          transform(node);
          (proof ? proof.children : output).push(node);
        }
      }
      if (proof) throw new Error('A #proof-hidden block is missing its closing #end-proof in this list item or block.');
      parent.children = output;
    }
    transform(tree);
  };
}
