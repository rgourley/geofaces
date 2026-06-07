<div align="center">

# geofaces

**Deterministic flat-geometric avatar faces. Same name, same face. Nothing to host.**

<img width="1200" height="630" alt="image-1780793779638" src="https://github.com/user-attachments/assets/1730d33a-3659-4d14-a11c-c2dc415c1563" />


[![npm](https://img.shields.io/npm/v/geofaces.svg)](https://www.npmjs.com/package/geofaces) · zero dependencies · ~3&nbsp;KB gzipped · MIT

**[▶ Try it live](https://rgourley.github.io/geofaces/)** — type a name, switch shapes, copy the SVG.

</div>

---

Give it a username, an email, an id, anything stable, and `geofaces` returns a friendly little SVG face. The same string always produces the same face, on every machine, forever. There is nothing to generate ahead of time, nothing to upload, nothing to cache. You store the username; the avatar comes for free.

Every face is drawn from SVG primitives at call time. No image files ship with the library, no requests go out, and there is no randomness at runtime. It is a pure function of a hashed seed.

<p align="left">
  <img src="assets/samples/rob.svg" width="72" alt="" />
  <img src="assets/samples/ada-lovelace.svg" width="72" alt="" />
  <img src="assets/samples/massive-com.svg" width="72" alt="" />
  <img src="assets/samples/satoshi.svg" width="72" alt="" />
  <img src="assets/samples/grace-hopper.svg" width="72" alt="" />
  <img src="assets/samples/linus.svg" width="72" alt="" />
  <img src="assets/samples/octocat.svg" width="72" alt="" />
  <img src="assets/samples/wallhunt.svg" width="72" alt="" />
</p>

## Why

- **Deterministic.** `geoFace("rob")` is the same SVG today, tomorrow, and on your colleague's laptop. Store the seed, skip the storage.
- **Zero dependencies, tiny.** No runtime deps. Around 3 KB gzipped for the core. The React wrapper adds almost nothing.
- **Framework-agnostic core.** A plain function that returns an SVG string. Drop it into React, Vue, Svelte, a server, an email, a static build, anywhere.
- **Readable by design.** Light-only fills and dark-ink features mean faces never go muddy, even where two colours blend.
- **Friendly, not generic.** Real little faces with eyes and a grin, not abstract noise. ~30,000 visibly-distinct combinations across 24 palettes, 6 face shapes, 7 eyes, 7 mouths, and 5 colour-blend overlays.

## Install

```bash
npm install geofaces
```

## Quick start

### React

Drop an avatar next to a name anywhere you list people: a comment thread, a member list, a table row, a presence stack.

```tsx
import { GeoFace } from "geofaces/react";

export function CommentList({ comments }) {
  return (
    <ul className="comments">
      {comments.map((c) => (
        <li key={c.id} className="comment">
          <GeoFace name={c.authorEmail} size={40} shape="circle" />
          <div>
            <span className="author">{c.author}</span>
            <p>{c.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

The component renders the SVG through an `<img>`, so it works in React Server Components and SSR with no hydration and no raw-HTML injection.

```tsx
<GeoFace name="rob@example.com" size={48} />                 {/* rounded squircle (default) */}
<GeoFace name="rob@example.com" size={48} shape="circle" />  {/* circle */}
<GeoFace name="rob@example.com" size={48} shape="square" />  {/* hard corners */}
```

### Vanilla / any framework

```ts
import { geoFace, geoFaceDataUri } from "geofaces";

// 1. an SVG string
const svg = geoFace("rob@example.com", { size: 64 });

// 2. a data URI, for an <img> or CSS background
img.src = geoFaceDataUri("rob@example.com", { size: 64 });
el.style.backgroundImage = `url("${geoFaceDataUri("rob@example.com")}")`;
```

### Plain HTML, no build, no npm

You do not have to bundle anything or host the script yourself. A public CDN (jsDelivr) serves it straight off npm, exposing a global `geofaces`:

```html
<script src="https://cdn.jsdelivr.net/npm/geofaces"></script>
<img id="me" width="64" height="64" alt="" />
<script>
  document.getElementById("me").src =
    geofaces.geoFaceDataUri("rob@example.com", { shape: "circle", size: 64 });
</script>
```

Prefer ES modules? Import it from a CDN with no install step:

```html
<script type="module">
  import { geoFace } from "https://esm.sh/geofaces";
  // …use geoFace("name")
</script>
```

### Inline, no JS at all

`geoFace()` runs anywhere JavaScript runs, including build steps. Pre-render avatars to static SVG files, inline them into HTML, or pipe them into transactional emails. Nothing about the output depends on the browser.

### From a non-JavaScript backend (Python, Ruby, Go, PHP…)

`geofaces` is a JS package, so the cleanest way to use it from another language is a tiny image endpoint that any platform can hit with a plain `<img>`:

```js
// avatar-server.mjs — one route, returns an SVG for any name
import { createServer } from "node:http";
import { geoFace } from "geofaces";

createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, "http://x").pathname.slice(1));
  res.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "public, max-age=31536000, immutable" });
  res.end(geoFace(name, { size: 120, shape: "circle" }));
}).listen(8080);
```

```html
<img src="https://your-host/rob@example.com" width="48" height="48" alt="" />
```

Because the output is deterministic, that endpoint caches forever. If you'd rather not run a service, the generator is ~150 lines of pure math and ports cleanly to any language.

## API

#### `geoFace(name, options?) → string`

Returns a complete `<svg>` string.

| option  | type                                  | default     | notes                                                      |
| ------- | ------------------------------------- | ----------- | ---------------------------------------------------------- |
| `size`  | `number`                              | `80`        | Rendered width and height in pixels.                       |
| `shape` | `"rounded" \| "circle" \| "square"`   | `"rounded"` | Outline clipped into the SVG itself (no CSS needed).       |
| `title` | `string \| null`                      | `name`      | Accessible label. `null` omits the title and `aria-label`. |

`shape` is baked into the SVG, so a `circle` avatar stays a circle inside a plain `<img>` or an email, where you can't reach it with CSS.

#### `geoFaceDataUri(name, options?) → string`

The same SVG, URL-encoded as a `data:image/svg+xml,...` URI for `<img src>` or `background-image`.

#### `geoFaceInner(name) → string`

Just the inner markup in a `0 0 100 100` coordinate space, with no wrapping `<svg>`. Use it to compose avatars into a larger SVG (this is how the hero grid above is built).

#### `<GeoFace name size? shape? ...img />` (from `geofaces/react`)

| prop    | type                                | default     | notes     |
| ------- | ----------------------------------- | ----------- | --------- |
| `name`  | `string`                            | —           | The seed. |
| `size`  | `number`                            | `80`        | Pixels.   |
| `shape` | `"rounded" \| "circle" \| "square"` | `"rounded"` | Outline.  |

Any other `<img>` attribute (`className`, `loading`, `onClick`, …) passes straight through.

## How it works

The input string is hashed into a single integer. That integer is the seed for everything: which palette, which face shape, where the eyes sit, how wide the grin is, which colour-blend overlay lands on top. No `Math.random()`, no state, no iteration. Same seed in, same pixels out.

Each face is assembled from a small kit of SVG primitives:

- **24 palettes** of light fills plus one dark ink. Features are always drawn in the dark ink over light fills, so they stay legible.
- **6 face shapes** (circle, rounded square, squircle, hexagon, capsule, octagon).
- **7 eye styles** and **7 mouths**, the mouths weighted toward friendly (a filled grin shows up most).
- **5 overlays** that blend a second palette colour into the face with `mix-blend-mode: multiply`: an oversized lens, a hard split, a diagonal slab, a split-plus-accent, or none. The blend strength itself varies per seed.

That is roughly **30,000 faces a person would call visibly different**, and into the tens of millions once you count the finer variation in size, placement, tilt, and blend. Good for tens of thousands of users before lookalikes appear.

## Accessibility

By default the SVG carries `role="img"` and an `aria-label` set to the name, plus a `<title>`. For purely decorative avatars sitting next to a visible name, pass `title: null` (the React component already does this and gives the `<img>` a sensible `alt`).

## How it compares to boring-avatars

[boring-avatars](https://github.com/boringdesigners/boring-avatars) is excellent and a clear inspiration. The difference is intent: boring-avatars leans abstract (marble, rings, pixels). `geofaces` makes actual little faces, weighted to feel friendly, with a colour-blend overlay system that gives each one a distinct two-tone character. Pick whichever fits your product's personality.

## Development

```bash
npm install
npm run build      # bundles ESM + CJS + types into dist/ via tsup
npm run samples    # regenerates assets/ from the current generator
npm run typecheck  # tsc --noEmit
open docs/index.html       # the public demo (also served at the Try-it-live link)
open examples/index.html   # the dev playground used to design the look
```

The demo lives in `docs/`. Enable GitHub Pages on the `main` branch with the `/docs` folder to publish it at `https://rgourley.github.io/geofaces/` (no build step needed, it is a single self-contained file).

## License

MIT © [Rob Gourley](https://www.robertcreative.com/)
