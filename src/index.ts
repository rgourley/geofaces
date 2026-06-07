/**
 * geofaces — deterministic flat-geometric avatar faces.
 *
 * Same input string always produces the same face. No assets, no network,
 * no randomness at runtime: every avatar is a pure function of a hashed seed,
 * rendered as a self-contained SVG string.
 */

/** Outline baked into the SVG itself (works without CSS, e.g. `<img>` or email). */
export type GeoFaceShape = "rounded" | "circle" | "square";

export type GeoFaceOptions = {
  /** Rendered width and height in pixels. Default 80. */
  size?: number;
  /** Outline clipped into the SVG. Default `"rounded"` (squircle). */
  shape?: GeoFaceShape;
  /**
   * Accessible label. Defaults to the input `name`.
   * Pass `null` to omit the title/aria-label entirely (decorative use).
   */
  title?: string | null;
};

type Palette = {
  /** Dark colour, used only for the facial features so they always read. */
  readonly ink: string;
  /** Five light fills — face, tile and overlay colours are drawn from these. */
  readonly c: readonly [string, string, string, string, string];
};

type FaceColors = {
  readonly tile: string;
  readonly face: string;
  readonly second: string;
  readonly accent: string;
  readonly ink: string;
};

// Light-only fills keep multiply-blended overlays from ever darkening a face
// enough to swallow the dark-ink features. Dark tones live in `ink` only.
const PALETTES: readonly Palette[] = [
  { ink: "#20202c", c: ["#FF6B6B", "#FFD93D", "#6BCB77", "#FF9F45", "#67C7FF"] },
  { ink: "#5b2333", c: ["#F8B195", "#F67280", "#FFC2A1", "#FFD6A5", "#FF9AA2"] },
  { ink: "#0d3b3b", c: ["#2DD4A8", "#FFD166", "#FF7B9C", "#83E8BA", "#7FD8FF"] },
  { ink: "#1a3a3a", c: ["#FFBF69", "#FFB23E", "#46D7C8", "#CBF3F0", "#FFD6A5"] },
  { ink: "#3a2a40", c: ["#FF8FB1", "#FFC2E2", "#FFE3A9", "#9DE0AD", "#A0E7E5"] },
  { ink: "#22223b", c: ["#FFADAD", "#A0C4FF", "#BDB2FF", "#FDFFB6", "#9BF6FF"] },
  { ink: "#1a2238", c: ["#FFCB77", "#FE8A8F", "#7FE0CE", "#FEF0C9", "#8FD9F2"] },
  { ink: "#2a1a1a", c: ["#FFB85C", "#F4A261", "#E9C46A", "#90D2C0", "#FFB4A2"] },
  { ink: "#2b2d42", c: ["#8ECAE6", "#A2D2FF", "#BDE0FE", "#CDB4DB", "#FFC8DD"] },
  { ink: "#1d3038", c: ["#95D5B2", "#B7E4C7", "#D8F3DC", "#FFE066", "#FFA552"] },
  { ink: "#3a1f2b", c: ["#FF99C8", "#FCF6BD", "#D0F4DE", "#A9DEF9", "#E4C1F9"] },
  { ink: "#22303a", c: ["#76C893", "#99D98C", "#B5E48C", "#D9ED92", "#FFD166"] },
  { ink: "#2e2a1f", c: ["#FFE5A0", "#FFCB69", "#FF9B54", "#FFB07C", "#FFD6A5"] },
  { ink: "#1e2a3a", c: ["#90E0EF", "#62CDE0", "#ADE8F4", "#CAF0F8", "#FFD6A5"] },
  { ink: "#2a1e3a", c: ["#CDB4DB", "#FFC8DD", "#FFAFCC", "#BDE0FE", "#A2D2FF"] },
  { ink: "#2b241a", c: ["#F6BD60", "#F7EDE2", "#F5CAC3", "#9CC0B7", "#F28482"] },
  { ink: "#3a2820", c: ["#E8A87C", "#F2D5A0", "#C7CEA6", "#EC9A6D", "#F4E3C1"] },
  { ink: "#23303a", c: ["#7EC4CF", "#B8E0D2", "#FAD4C0", "#F5B895", "#D6E5E3"] },
  { ink: "#2e2440", c: ["#C3AED6", "#E3D7F4", "#FFF3B0", "#FFD6E0", "#B5D6E0"] },
  { ink: "#33231f", c: ["#FF8C6B", "#FFB997", "#FCEFA1", "#A8E6CF", "#FFD3B6"] },
  { ink: "#262a40", c: ["#A6B1E1", "#C8CFF0", "#F7D9E3", "#FBC4D0", "#D4DCF0"] },
  { ink: "#1f3329", c: ["#88D8B0", "#B7E5C2", "#F5E8A0", "#F2C879", "#D4EAC0"] },
  { ink: "#2a2438", c: ["#D7A9E3", "#E9C6F0", "#B8E0F0", "#A9D6E5", "#F2D0E0"] },
  { ink: "#2b261c", c: ["#F2C57C", "#F7E1A0", "#BFD8B8", "#7FB7BE", "#E6D2A8"] },
];

// Mouths weighted toward the friendly ones: filled grin (2) is the signature,
// smile arc (0) and open-laugh (7) back it up. All mouths are filled (no outlines).
const MOUTHS: readonly number[] = [2, 2, 2, 2, 2, 0, 0, 0, 7, 7, 7, 1, 3, 5, 6];

// --- deterministic hash + bit pickers (boring-avatars style) ---
function hashCode(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h &= h;
  }
  return Math.abs(h);
}

function digit(n: number, p: number): number {
  return Math.floor((n / Math.pow(10, p)) % 10);
}

function unit(n: number, range: number, p: number): number {
  const v = n % range;
  return digit(n, p) % 2 === 0 ? -v : v;
}

function bool(n: number, p: number): boolean {
  return digit(n, p) % 2 === 0;
}

function pick(n: number, p: number, len: number): number {
  return digit(n, p) % len;
}

function colors(h: number): FaceColors {
  const p = PALETTES[h % PALETTES.length];
  const b = p.c;
  const L = b.length;
  const tile = pick(h, 1, L);
  const face = (tile + 1 + pick(h, 2, L - 1)) % L;
  const second = (face + 1 + pick(h, 3, L - 1)) % L;
  const accent = (second + 1 + pick(h, 4, L - 1)) % L;
  return { tile: b[tile], face: b[face], second: b[second], accent: b[accent], ink: p.ink };
}

// --- shapes (viewBox 0 0 100 100, face centred at 50,50) ---
function faceShape(s: number, fill: string): string {
  switch (s) {
    case 0: return `<circle cx="50" cy="50" r="40" fill="${fill}"/>`;
    case 1: return `<rect x="12" y="12" width="76" height="76" rx="16" fill="${fill}"/>`;
    case 2: return `<rect x="11" y="11" width="78" height="78" rx="34" fill="${fill}"/>`;
    case 3: return `<polygon points="50,10 86,32 86,68 50,90 14,68 14,32" fill="${fill}"/>`;
    case 4: return `<rect x="20" y="9" width="60" height="82" rx="30" fill="${fill}"/>`;
    default: return `<polygon points="30,12 70,12 88,30 88,70 70,88 30,88 12,70 12,30" fill="${fill}"/>`;
  }
}

// Blend strength varies per seed across 0.30–0.60.
function blendOp(h: number): string {
  return (0.3 + (Math.floor(h / 13) % 7) / 20).toFixed(2);
}

function lens(h: number, col: FaceColors): string {
  const side = bool(h, 5) ? 1 : -1;
  const cx = 50 + side * (8 + (h % 7));
  const cy = 50 + unit(h, 11, 6);
  const r = 40 + (digit(h, 7) % 4);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col.second}" style="mix-blend-mode:multiply" opacity="${blendOp(h)}"/>`;
}

function split(h: number, col: FaceColors): string {
  const vertical = bool(h, 6);
  const cut = 50 + unit(h, 14, 7);
  const x = vertical ? cut : 0;
  const y = vertical ? 0 : cut;
  const w = vertical ? 100 - cut : 100;
  const ht = vertical ? 100 : 100 - cut;
  return `<rect x="${x}" y="${y}" width="${w}" height="${ht}" fill="${col.second}" style="mix-blend-mode:multiply" opacity="${blendOp(h)}"/>`;
}

function diagonal(h: number, col: FaceColors): string {
  const off = unit(h, 18, 5);
  const pts = bool(h, 7)
    ? `0,${20 + off} 100,${60 + off} 100,100 0,100`
    : `100,${20 + off} 0,${60 + off} 0,100 100,100`;
  return `<polygon points="${pts}" fill="${col.second}" style="mix-blend-mode:multiply" opacity="${blendOp(h)}"/>`;
}

function splitAccent(h: number, col: FaceColors): string {
  const op = (Number(blendOp(h)) * 0.8).toFixed(2);
  return (
    split(h, col) +
    `<circle cx="${30 + unit(h, 16, 5)}" cy="38" r="22" fill="${col.accent}" style="mix-blend-mode:multiply" opacity="${op}"/>`
  );
}

// One seeded overlay per face. Lens ~37%, split ~21%, diagonal ~17%,
// split+accent ~4%, plain ~21%.
function overlay(h: number, col: FaceColors): string {
  const t = Math.floor(h / 100) % 24;
  if (t <= 8) return lens(h, col);
  if (t <= 13) return split(h, col);
  if (t <= 17) return diagonal(h, col);
  if (t === 18) return splitAccent(h, col);
  return "";
}

function eye(cx: number, cy: number, style: number, s: number, ink: string): string {
  switch (style) {
    case 0: return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="${ink}"/>`;
    case 1: return `<rect x="${cx - 2}" y="${cy - s}" width="4" height="${s * 2}" rx="2" fill="${ink}"/>`;
    case 2: return `<rect x="${cx - s * 0.82}" y="${cy - s * 0.82}" width="${s * 1.64}" height="${s * 1.64}" rx="${s * 0.55}" fill="${ink}"/>`;
    case 3: return `<path d="M ${cx - s} ${cy + 1} A ${s} ${s} 0 0 1 ${cx + s} ${cy + 1}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    case 4: return `<ellipse cx="${cx}" cy="${cy}" rx="${s * 0.72}" ry="${s}" fill="${ink}"/>`;
    case 5: return `<path d="M ${cx - s} ${cy} A ${s} ${s} 0 0 0 ${cx + s} ${cy}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    default: return `<rect x="${cx - s}" y="${cy - 1.6}" width="${s * 2}" height="3.2" rx="1.6" fill="${ink}"/>`;
  }
}

function mouth(cy: number, style: number, w: number, ink: string): string {
  switch (style) {
    case 0: return `<path d="M ${50 - w} ${cy} Q 50 ${cy + w} ${50 + w} ${cy}" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`;
    case 1: return `<rect x="${50 - w}" y="${cy - 1.6}" width="${w * 2}" height="3.2" rx="1.6" fill="${ink}"/>`;
    case 2: return `<path d="M ${50 - w} ${cy} A ${w} ${w} 0 0 0 ${50 + w} ${cy} Z" fill="${ink}"/>`;
    case 3: return `<circle cx="50" cy="${cy}" r="${Math.max(3, w * 0.45)}" fill="${ink}"/>`;
    case 5: return `<ellipse cx="50" cy="${cy}" rx="${w}" ry="${w * 0.6}" fill="${ink}"/>`;
    case 6: return `<rect x="${50 - w}" y="${cy - 2.5}" width="${w * 2}" height="5" rx="2.5" fill="${ink}"/>`;
    default: return `<path d="M ${50 - w} ${cy} Q 50 ${cy + w * 1.3} ${50 + w} ${cy} Q 50 ${cy + w * 0.35} ${50 - w} ${cy} Z" fill="${ink}"/>`;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function face(h: number): string {
  const col = colors(h);
  const fShape = pick(h, 2, 6);
  const eStyle = pick(h, 3, 7);
  const mStyle = MOUTHS[Math.floor(h / 17) % MOUTHS.length];
  const eyeSpacing = 14 + (h % 5);
  const eyeSize = 4 + (digit(h, 5) % 3);
  const eyeY = 43 + unit(h, 4, 6);
  const mouthY = 63 + (digit(h, 6) % 7);
  const mouthW = 8 + (digit(h, 7) % 7);
  const tilt = unit(h, 6, 8);
  const lx = 50 - eyeSpacing;
  const rx = 50 + eyeSpacing;
  const cid = `gf${h}`;
  const features =
    eye(lx, eyeY, eStyle, eyeSize, col.ink) +
    eye(rx, eyeY, eStyle, eyeSize, col.ink) +
    mouth(mouthY, mStyle, mouthW, col.ink);
  return (
    `<defs><clipPath id="${cid}">${faceShape(fShape, "#000")}</clipPath></defs>` +
    `<rect width="100" height="100" fill="${col.tile}"/>` +
    `<g transform="rotate(${tilt} 50 50)">` +
    `<g clip-path="url(#${cid})" style="isolation:isolate">${faceShape(fShape, col.face)}${overlay(h, col)}</g>` +
    `${features}</g>`
  );
}

/** The inner SVG markup (no wrapping `<svg>`), in a 0–100 coordinate space. */
export function geoFaceInner(name: string): string {
  return face(hashCode(name || " "));
}

function clipForShape(h: number, shape: GeoFaceShape, inner: string): string {
  if (shape === "square") return inner;
  const rx = shape === "circle" ? 50 : 22;
  const id = `gfc${h}`;
  return `<defs><clipPath id="${id}"><rect width="100" height="100" rx="${rx}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`;
}

/**
 * Render a deterministic avatar for `name` as a complete SVG string.
 *
 * @example
 * const svg = geoFace("rob@example.com", { size: 96, shape: "circle" });
 * element.replaceChildren(new DOMParser().parseFromString(svg, "image/svg+xml").documentElement);
 */
export function geoFace(name: string, options: GeoFaceOptions = {}): string {
  const { size = 80, shape = "rounded", title } = options;
  const h = hashCode(name || " ");
  const label = title === null ? null : title ?? name;
  const a11y = label === null ? "" : ` role="img" aria-label="${escapeXml(label)}"`;
  const titleEl = label === null ? "" : `<title>${escapeXml(label)}</title>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"${a11y}>` +
    `${titleEl}${clipForShape(h, shape, face(h))}</svg>`
  );
}

/** A `data:` URI for the avatar, ready to drop into an `<img src>` or `background-image`. */
export function geoFaceDataUri(name: string, options: GeoFaceOptions = {}): string {
  return `data:image/svg+xml,${encodeURIComponent(geoFace(name, options))}`;
}
