import { Resvg } from '@resvg/resvg-js';

export interface SvgToPngOptions {
  // Currently ignored (we don't scale in resvg; size is defined in MathJax)
  scale?: number;
  // Currently ignored (no resvg-side downscaling); kept for compatibility
  maxWidth?: number;
  // Background color, e.g., 'transparent' or '#ffffff' (undefined => transparent)
  background?: string;
}

// Intentionally no viewBox parsing here: we don't scale in resvg.

export function svgToPng(svg: string, opts: SvgToPngOptions = {}): Buffer {
  const background = opts.background; // undefined => transparent

  const options: import('@resvg/resvg-js').ResvgRenderOptions = {
    // Do not scale in resvg; honor the original SVG sizing from MathJax
    fitTo: { mode: 'original' },
  };
  if (background !== undefined) options.background = background;

  const resvg = new Resvg(svg, options);
  const png = resvg.render();
  return png.asPng();
}
