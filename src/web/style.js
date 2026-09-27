/**
 * Style engine: converts React Native style objects / arrays into
 * browser CSS objects so the original StyleSheet definitions (brand
 * colours, spacing, typography) are preserved 1:1 on the web.
 */

// Properties that stay unit-less numbers in CSS
const UNITLESS = new Set([
  'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'fontWeight', 'aspectRatio',
  'order', 'scale', 'WebkitLineClamp',
]);

// Properties that only exist in React Native and have no CSS meaning
const DROP = new Set([
  'textAlignVertical', 'includeFontPadding', 'elevation', 'shadowColor',
  'shadowOffset', 'shadowOpacity', 'shadowRadius', 'resizeMode', 'tintColor',
  'overlayColor', 'backfaceVisibility_rn', 'writingDirection',
]);

const px = (v) => (typeof v === 'number' ? `${v}px` : v);

function hexToRgba(color, alpha) {
  if (typeof color !== 'string') return `rgba(0,0,0,${alpha})`;
  const c = color.trim();
  if (c.startsWith('#')) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  return c;
}

function shadowOf(s) {
  if (s.shadowColor == null && s.shadowOpacity == null && s.elevation == null) return null;
  if (s.shadowOpacity === 0 || s.elevation === 0) return 'none';
  if (s.shadowOpacity != null || s.shadowRadius != null || s.shadowOffset) {
    const o = s.shadowOffset || { width: 0, height: 0 };
    const op = s.shadowOpacity != null ? s.shadowOpacity : 0.15;
    const r = s.shadowRadius != null ? s.shadowRadius : 4;
    return `${o.width || 0}px ${o.height || 0}px ${r * 2}px ${hexToRgba(s.shadowColor || '#000', op)}`;
  }
  if (s.elevation) {
    const e = s.elevation;
    return `0 ${Math.round(e / 2)}px ${e * 2}px rgba(0,0,0,${Math.min(0.08 + e * 0.015, 0.3)})`;
  }
  return null;
}

function transformOf(list) {
  if (!Array.isArray(list)) return list;
  return list
    .map((t) => {
      const k = Object.keys(t)[0];
      const v = t[k];
      if (k.startsWith('translate')) return `${k}(${px(v)})`;
      return `${k}(${v})`;
    })
    .join(' ');
}

/** Convert one flat RN style object into CSS. */
export function toCSS(s) {
  const out = {};
  // 1. general shorthands first so specific ones override (RN semantics)
  const order = (k) =>
    ({ padding: 0, margin: 0, borderWidth: 0, borderColor: 0, borderRadius: 0, paddingHorizontal: 1, paddingVertical: 1, marginHorizontal: 1, marginVertical: 1 }[k] ?? 2);
  const keys = Object.keys(s).sort((a, b) => order(a) - order(b));

  for (const k of keys) {
    const v = s[k];
    if (v === undefined || v === null) continue;
    if (DROP.has(k)) continue;
    switch (k) {
      case 'paddingHorizontal': out.paddingLeft = px(v); out.paddingRight = px(v); break;
      case 'paddingVertical': out.paddingTop = px(v); out.paddingBottom = px(v); break;
      case 'marginHorizontal': out.marginLeft = px(v); out.marginRight = px(v); break;
      case 'marginVertical': out.marginTop = px(v); out.marginBottom = px(v); break;
      case 'padding': out.paddingTop = out.paddingBottom = out.paddingLeft = out.paddingRight = px(v); break;
      case 'margin': out.marginTop = out.marginBottom = out.marginLeft = out.marginRight = px(v); break;
      case 'paddingStart': out.paddingLeft = px(v); break;
      case 'paddingEnd': out.paddingRight = px(v); break;
      case 'marginStart': out.marginLeft = px(v); break;
      case 'marginEnd': out.marginRight = px(v); break;
      case 'flex':
        if (typeof v === 'number') {
          if (v > 0) { out.flexGrow = v; out.flexShrink = 1; out.flexBasis = '0%'; }
          else if (v === 0) { out.flexGrow = 0; out.flexShrink = 0; out.flexBasis = 'auto'; }
          else { out.flexGrow = 0; out.flexShrink = 1; out.flexBasis = 'auto'; }
        } else out.flex = v;
        break;
      case 'transform': out.transform = transformOf(v); break;
      case 'fontWeight': out.fontWeight = v === 'bold' ? 700 : v === 'normal' ? 400 : v; break;
      case 'lineHeight': out.lineHeight = px(v); break;
      case 'borderStyle': out.borderStyle = v; break;
      case 'fontFamily': break; // keep the web font stack
      default:
        out[k] = UNITLESS.has(k) ? v : px(v);
    }
  }
  const sh = shadowOf(s);
  if (sh) out.boxShadow = sh;
  if (s.resizeMode && out.objectFit == null) out.objectFit = RESIZE[s.resizeMode] || 'cover';
  return out;
}

export const RESIZE = { cover: 'cover', contain: 'contain', stretch: 'fill', center: 'none', repeat: 'none' };

function flatten(style, acc) {
  if (!style) return acc;
  if (Array.isArray(style)) {
    for (const s of style) flatten(s, acc);
    return acc;
  }
  if (typeof style === 'object') Object.assign(acc, style);
  return acc;
}

const cache = new WeakMap();

/**
 * sx(style, numberOfLines?) → CSS object.
 * Accepts the same values the RN `style` prop accepted (objects, arrays,
 * falsy entries) and optional Text numberOfLines for line clamping.
 */
export function sx(style, lines) {
  let css;
  if (style && typeof style === 'object' && !Array.isArray(style)) {
    css = cache.get(style);
    if (!css) { css = toCSS(style); cache.set(style, css); }
  } else {
    css = toCSS(flatten(style, {}));
  }
  if (lines) {
    css = {
      ...css,
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    };
  }
  return css;
}

/** RN Image `source` → <img src>. Handles {uri}, imported modules, strings. */
export function imgSrc(source) {
  if (!source) return undefined;
  if (typeof source === 'string') return source;
  if (Array.isArray(source)) return imgSrc(source[0]);
  if (typeof source === 'object' && 'uri' in source) return source.uri || undefined;
  if (typeof source === 'object' && source.default) return source.default;
  return source;
}

export const StyleSheet = {
  create: (o) => o,
  flatten: (s) => flatten(s, {}),
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
};
