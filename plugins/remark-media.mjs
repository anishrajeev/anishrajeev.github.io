import path from 'node:path';

const PHOTO = /^#photo\s+(\S+)(?:\s+["“]([^"”]*)["”])?$/;
const GALLERY = /^#gallery\s+(.+)$/;

function paragraphText(node) {
  return node?.type === 'paragraph' && node.children?.length === 1 && node.children[0].type === 'text'
    ? node.children[0].value
    : null;
}

function imageNode(url, alt = '') {
  return { type: 'image', url, alt };
}

export default function remarkMedia() {
  return (tree, file) => {
    for (let index = 0; index < tree.children.length; index += 1) {
      const value = paragraphText(tree.children[index]);
      const photo = value?.match(PHOTO);
      if (photo) {
        const caption = photo[2] ?? path.basename(photo[1], path.extname(photo[1])).replaceAll(/[-_]/g, ' ');
        tree.children.splice(index, 1,
          { type: 'html', value: '<figure class="photo">' },
          imageNode(photo[1], caption),
          { type: 'html', value: `<figcaption>${caption.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</figcaption></figure>` },
        );
        index += 2;
        continue;
      }
      const gallery = value?.match(GALLERY);
      if (!gallery) continue;
      const urls = gallery[1].trim().split(/\s+/);
      tree.children.splice(index, 1,
        { type: 'html', value: '<div class="photo-gallery">' },
        ...urls.map((url) => imageNode(url, path.basename(url, path.extname(url)).replaceAll(/[-_]/g, ' '))),
        { type: 'html', value: '</div>' },
      );
      index += urls.length + 1;
    }
  };
}
