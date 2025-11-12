// biome-ignore lint/suspicious/noExplicitAny: mathjax v3/4 has no official types.
let initPromise: Promise<any> | null = null;
export const MATHJAX_SVG_SCALE = 3; // ~3x default 16px => ~48px
export const FORMULA_TARGET_PX_HEIGHT = 48; // Desired final formula pixel height
export const FORMULA_CANVAS_PADDING_PX = 6; // Extra margin around formula canvas

async function getMathJax() {
  if (!initPromise) {
    // @ts-expect-error ts(2307) - mathjax lacks type definitions
    // biome-ignore lint/suspicious/noExplicitAny: mathjax v3/4 has no official types
    const mod: any = await import('mathjax');
    const MathJax = mod?.default ?? mod;
    initPromise = MathJax.init({
      loader: { load: ['input/tex', 'output/svg'] },
      // Fix visual font size (~48px via MATHJAX_SVG_SCALE). We do not configure line breaking.
      svg: {
        fontCache: 'none',
        scale: MATHJAX_SVG_SCALE,
      },
    });
  }
  return initPromise;
}

export async function texToSvg(input: string): Promise<string> {
  // biome-ignore lint/suspicious/noExplicitAny: mathjax v3/4 has no official types
  const MathJax: any = await getMathJax();
  // Use promise-based API to avoid retry errors when async assets are needed
  const node = MathJax.tex2svgPromise
    ? await MathJax.tex2svgPromise(input, { display: true })
    : MathJax.tex2svg(input, { display: true });
  const html: string = MathJax.startup.adaptor.outerHTML(node);

  // Extract only the <svg>...</svg> element, since @resvg/resvg-js
  // requires the root element to be <svg> (not a wrapper like <mjx-container>).
  const start = html.indexOf('<svg');
  const end = html.lastIndexOf('</svg>');
  if (start === -1 || end === -1) {
    throw new Error('Failed to extract <svg> from MathJax output');
  }
  let svg = html.slice(start, end + '</svg>'.length);

  // Convert MathJax's ex-based width/height to pixel-based dimensions so that
  // resvg (fitTo: original) renders at a consistent pixel height.
  // Additionally, add fixed pixel padding to width/height and adjust viewBox
  // to preserve scale (no visual scaling from padding change).
  try {
    const tagStart = svg.indexOf('<svg');
    const tagEnd = svg.indexOf('>', tagStart);
    if (tagStart !== -1 && tagEnd !== -1) {
      const openTag = svg.slice(tagStart, tagEnd + 1);
      const widthMatch = openTag.match(/\bwidth\s*=\s*"([\d.]+)ex"/i);
      const heightMatch = openTag.match(/\bheight\s*=\s*"([\d.]+)ex"/i);
      const viewBoxMatch = openTag.match(
        /viewBox\s*=\s*"\s*(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)\s*"/i
      );
      if (heightMatch) {
        const heightExStr = heightMatch[1] ?? '';
        const heightEx = parseFloat(heightExStr);
        if (Number.isFinite(heightEx) && heightEx > 0) {
          const pxPerEx = FORMULA_TARGET_PX_HEIGHT / heightEx;
          let newWidthAttr = '';
          let widthPx = 0;
          if (widthMatch) {
            const widthExStr = widthMatch[1] ?? '';
            const widthEx = parseFloat(widthExStr);
            if (Number.isFinite(widthEx) && widthEx > 0) {
              widthPx = Math.round(widthEx * pxPerEx);
              newWidthAttr = `width="${widthPx}px"`;
            }
          }
          const heightPx = FORMULA_TARGET_PX_HEIGHT;

          // Apply padding by increasing width/height in px and adjusting viewBox
          const pad = FORMULA_CANVAS_PADDING_PX;
          const paddedWidthPx = (widthPx || 0) + pad * 2;
          const paddedHeightPx = heightPx + pad * 2;

          // Prepare updated width/height attributes with padding
          const finalWidthAttr = `width="${paddedWidthPx}px"`;
          const finalHeightAttr = `height="${paddedHeightPx}px"`;

          let newOpenTag = openTag;
          if (widthMatch && newWidthAttr) {
            newOpenTag = newOpenTag.replace(/\bwidth\s*=\s*"[^"]+"/i, finalWidthAttr);
          } else {
            // If no width attribute was present, inject one
            newOpenTag = newOpenTag.replace('<svg', `<svg ${finalWidthAttr}`);
          }
          if (newOpenTag.match(/\bheight\s*=\s*"[^"]+"/i)) {
            newOpenTag = newOpenTag.replace(/\bheight\s*=\s*"[^"]+"/i, finalHeightAttr);
          } else {
            newOpenTag = newOpenTag.replace('<svg', `<svg ${finalHeightAttr}`);
          }

          // Ensure text color is #fbfbfb by setting currentColor at root
          const colorHex = '#fbfbfb';
          const styleMatch = newOpenTag.match(/\bstyle\s*=\s*"([^"]*)"/i);
          if (styleMatch) {
            const cur = styleMatch[1] ?? '';
            const joined = cur.includes('color:')
              ? cur
              : `${cur}${cur.trim().endsWith(';') || cur.trim() === '' ? '' : ';'} color: ${colorHex};`;
            newOpenTag = newOpenTag.replace(/\bstyle\s*=\s*"[^"]*"/i, `style="${joined}"`);
          } else {
            newOpenTag = newOpenTag.replace('<svg', `<svg style="color: ${colorHex};"`);
          }

          // If we know the viewBox, expand it to keep visual scale identical.
          if (viewBoxMatch) {
            const minX = parseFloat(viewBoxMatch[1] ?? '0');
            const minY = parseFloat(viewBoxMatch[2] ?? '0');
            const vbw = parseFloat(viewBoxMatch[3] ?? '0');
            const vbh = parseFloat(viewBoxMatch[4] ?? '0');
            if (Number.isFinite(vbw) && vbw > 0 && Number.isFinite(vbh) && vbh > 0) {
              const unitsPerPxW = vbw / (widthPx || 1);
              const unitsPerPxH = vbh / heightPx;
              const padUnitsW = pad * unitsPerPxW;
              const padUnitsH = pad * unitsPerPxH;
              const newMinX = minX - padUnitsW;
              const newMinY = minY - padUnitsH;
              const newVbw = vbw + padUnitsW * 2;
              const newVbh = vbh + padUnitsH * 2;
              const newViewBox = `viewBox="${newMinX} ${newMinY} ${newVbw} ${newVbh}"`;
              newOpenTag = newOpenTag.replace(/viewBox\s*=\s*"[^"]+"/i, newViewBox);
            }
          }

          svg = newOpenTag + svg.slice(tagEnd + 1);
        }
      }
    }
  } catch {
    // If conversion fails, fall back to the original SVG
  }

  return svg;
}
