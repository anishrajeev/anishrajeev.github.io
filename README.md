# anish.ink

The public site is built by Astro, but writing a post is just editing Markdown.

## Write a post

```bash
npm install
npm run new -- "The Fundamental Group"
npm run dev
```

Open the path printed by `npm run new`, then open <http://localhost:4321/posts/the-fundamental-group.html>.
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

Push to `main` to deploy with GitHub Pages. The sitemap is generated during the build. The
unpublished Stone duality, coinduction, and intuitive model theory files are preserved
under `drafts/stale/` and are never included in the site.
