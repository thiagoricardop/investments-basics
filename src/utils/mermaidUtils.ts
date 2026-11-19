export interface PreparedMermaidSvg {
  svg: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  isWide: boolean;
}

/**
 * Normalizes line endings and trims surrounding whitespace for deterministic caching.
 */
export function normalizeMermaidChart(chart: string): string {
  return chart.replace(/\r\n?/g, '\n').trim();
}

/**
 * Generates a deterministic cache key for a Mermaid diagram + theme pair.
 */
export function getMermaidCacheKey(chart: string, isDark: boolean): string {
  return `${isDark ? 'dark' : 'light'}::${normalizeMermaidChart(chart)}`;
}

/**
 * Extracts numeric viewBox dimensions from a rendered SVG string.
 */
export function parseSvgViewBox(svg: string): { width: number; height: number } {
  const vbMatch = /\bviewBox=["']([^"']+)["']/i.exec(svg);
  if (vbMatch) {
    const parts = vbMatch[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
      return {
        width: Math.max(0, parts[2]),
        height: Math.max(0, parts[3]),
      };
    }
  }

  const wMatch = /\bwidth=["'](\d+(?:\.\d+)?)px?["']/i.exec(svg);
  const hMatch = /\bheight=["'](\d+(?:\.\d+)?)px?["']/i.exec(svg);
  return {
    width: wMatch ? Number(wMatch[1]) : 0,
    height: hMatch ? Number(hMatch[1]) : 0,
  };
}

/**
 * Normalizes Mermaid's rendered SVG attributes so tall flowcharts scale cleanly
 * to the reading column while wide horizontal flowcharts remain legible inside
 * a horizontally scrollable frame instead of shrinking to unreadable micro-text.
 */
export function prepareMermaidSvg(rawSvg: string): PreparedMermaidSvg {
  const { width, height } = parseSvgViewBox(rawSvg);
  const aspectRatio = height > 0 ? width / height : 1;
  const isWide = width > 780 && aspectRatio > 2.2;

  const wideTargetWidth = Math.min(Math.round(width), 1480);
  const targetInlineStyle = isWide
    ? `width: ${wideTargetWidth}px; min-width: ${wideTargetWidth}px; max-width: none; height: auto; display: block; flex-shrink: 0;`
    : width > 0
      ? `width: 100%; max-width: ${Math.round(width)}px; height: auto; display: block;`
      : 'width: 100%; max-width: 100%; height: auto; display: block;';

  const normalized = rawSvg.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    const cleaned = attrs
      .replace(/\s+width=(["'])[^"']*\1/gi, '')
      .replace(/\s+height=(["'])[^"']*\1/gi, '')
      .replace(/\s+style=(["'])[^"']*\1/gi, '');
    return `<svg${cleaned} style="${targetInlineStyle}">`;
  });

  return {
    svg: normalized,
    viewBoxWidth: width,
    viewBoxHeight: height,
    isWide,
  };
}
