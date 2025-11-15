// ESM script (project has "type": "module").
// Run with:
//   pnpm exec node --import=tsx ./src/tools/debugSvg.js

import { Resvg } from '@resvg/resvg-js';
import { FORMULA_TARGET_PX_HEIGHT, MATHJAX_SVG_SCALE, texToSvg } from '../modules/texToSvg.ts';

function extractSvgOpenTag(svg) {
  const start = svg.indexOf('<svg');
  if (start === -1) return null;
  const end = svg.indexOf('>', start);
  if (end === -1) return null;
  return svg.slice(start, end + 1);
}

function extractAttr(tag, name) {
  if (!tag) return null;
  const re = new RegExp(`${name}\\s*=\\s*"([^"]+)"`, 'i');
  const m = tag.match(re);
  return m ? m[1] : null;
}

function parseViewBox(vb) {
  if (!vb) return null;
  // Allow negatives and decimals: minX minY width height
  const m = vb
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const [, minX, minY, width, height] = m.map(Number);
  return { minX, minY, width, height };
}

async function inspect(tex) {
  const svg = await texToSvg(tex);
  const open = extractSvgOpenTag(svg);
  const vbRaw = extractAttr(open, 'viewBox');
  const widthAttr = extractAttr(open, 'width');
  const heightAttr = extractAttr(open, 'height');
  const vb = parseViewBox(vbRaw);
  // Render with resvg using original sizing (no scaling) to get final PNG size
  const resvg = new Resvg(svg, { fitTo: { mode: 'original' } });
  const rendered = resvg.render();
  const outW = rendered.width;
  const outH = rendered.height;

  console.log('============================================================');
  console.log(`TeX: ${tex}`);
  console.log('MathJax defined scale:', MATHJAX_SVG_SCALE, `(~${16 * MATHJAX_SVG_SCALE}px base font)`);
  console.log('Target pixel height (MathJax step):', `${FORMULA_TARGET_PX_HEIGHT}px`);
  console.log('SVG <open tag>:', open);
  console.log('viewBox:', vbRaw);
  console.log('viewBox parsed:', vb);
  console.log('width attr:', widthAttr, 'height attr:', heightAttr);
  console.log('Final PNG size (no resvg scaling):', `${outW} x ${outH} px`);
}

async function main() {
  const inputs = process.argv.slice(2);
  const samples =
    inputs.length > 0
      ? inputs
      : [
          String.raw`X(\omega = x)`,
          String.raw`L : \Theta \times \Theta \rightarrow \mathbb{R};\hspace{1em}  L(\theta,\,T(\boldsymbol{X})) = |\, T(\boldsymbol{X}) - \theta \,|^{2}`,
        ];
  for (const tex of samples) {
    try {
      await inspect(tex);
    } catch (e) {
      console.error('Error while rendering:', e);
    }
  }
}

await main();
