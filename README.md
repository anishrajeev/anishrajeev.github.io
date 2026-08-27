# anish.ink

The public site is built by Astro, but writing a post is just editing Markdown.

## Write a post

```bash
npm install
npm run new -- "The Fundamental Group"
npm run dev
```

Open the file printed by `npm run new`, then visit `/posts/the-fundamental-group.html` on the
local address printed by `npm run dev` (usually <http://localhost:4321>).
Saving the Markdown refreshes the browser. New posts start with `status: draft`; change that to
`status: published` when they are ready to appear in production. Use `status: stale` to keep a post
in the repository while hiding it from both development and production.

Put a post's images and source files in its neighboring `resources/` folder. Ordinary images use
normal Markdown:

```md
![Loops on a torus](./resources/torus.jpg)
```

For a caption or a compact two-column gallery, write one of these on its own line:

```md
#photo ./resources/torus.jpg "Loops on a torus"
#gallery ./resources/camp.jpg ./resources/sunset.jpg
```

Use `index.mdx` instead of `index.md` only when a post contains an interactive component. The
included example looks like this; `client:visible` makes its JavaScript wait until the graph is near
the viewport:

```mdx
import CayleyGraph from '../../../components/math/CayleyGraph.svelte';

<CayleyGraph group="D4" highlight="subgroup" client:visible />
```

## Math and code

Set `math: true` in frontmatter, then use `$x^2$` or `$$x^2$$`. KaTeX renders during the build, so
math posts do not need browser JavaScript. Add shared commands in `src/styles/katex-macros.js`.

Fenced code is best for short fragments. To embed a real file without duplicating it:

```md
#code ./resources/hello.sml
#code ./resources/hello.sml --lines 8-19
#code ./resources/covering.py --region deck_transformations
```

Regions are marked with `# region: name` / `# endregion` (or the same markers after `//` or `;`).

## Manim animations

Write either of these on its own line:

```md
#animation ./resources/loop_deform.py
#animation ./resources/loop_deform.py --scene LoopDeform --quality h
```

Run the Markdown preview and Manim renderer in separate terminals:

```bash
npm run dev
npm run anim
```

The renderer is intentionally outside Astro's hot-reload loop. It writes content-hashed `.webm`
and `.jpg` files plus `animations.json` beside the Python source. Commit all three outputs; GitHub
Actions does not install Python, Manim, LaTeX, or ffmpeg and will fail clearly if an output is stale.

## Publishing and old work

Run `npm run check` before pushing to `main` (tests, build, then migration regression checks).
The regression checks protect the three migrated posts and shared draft handling. GitHub Actions builds and deploys
the site. In repository **Settings → Pages**, the source must remain **GitHub Actions**,
not “Deploy from a branch” (that runs Jekyll, which cannot build this Astro site).
The sitemap is generated during the build; there is no RSS feed.

## Where things live

- `src/content/posts/`: the posts you edit, each with its own resources. Only published posts'
  pages and raw resources are copied into the production build. Drafts are not private on GitHub.
- `src/layouts/`, `src/styles/`: shared layout and appearance; no styling to copy between posts.
- `src/assets/`: shared background photos and fonts. `public/`: the deployed CNAME and résumé.
- `plugins/`, `scripts/`: Markdown directives and author tools.
- `photos/`: the original photo collection, intentionally preserved. Post-local copies let you
  move a post together with its pictures.
- `drafts/stale/`: preserved pre-migration drafts, excluded from the website.
- Root `posts/`, `resources/`, and the root HTML files are retained legacy sources, not the live
  site. Root `CNAME` and `resume.pdf` are legacy copies; edit the versions in `public/`.
- `dist/`, `.astro/`, and `node_modules/` are generated locally and ignored by Git.
