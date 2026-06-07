import type { ImgHTMLAttributes, ReactElement } from "react";
import { geoFaceDataUri, type GeoFaceShape } from "./index";

export type GeoFaceProps = {
  /** The seed string — username, email, id, anything stable. */
  name: string;
  /** Rendered width and height in pixels. Default 80. */
  size?: number;
  /** Outline: `"rounded"` (squircle), `"circle"`, or `"square"`. Default `"rounded"`. */
  shape?: GeoFaceShape;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height">;

/**
 * A deterministic geofaces avatar. Renders a self-contained SVG via an `<img>`,
 * so it works in React Server Components and SSR with no hydration or runtime cost.
 *
 * @example
 * <GeoFace name="rob@example.com" size={48} shape="circle" />
 */
export function GeoFace({
  name,
  size = 80,
  shape = "rounded",
  alt,
  ...rest
}: GeoFaceProps): ReactElement {
  const src = geoFaceDataUri(name, { size, shape, title: null });
  return (
    <img src={src} width={size} height={size} alt={alt ?? `Avatar for ${name}`} {...rest} />
  );
}
