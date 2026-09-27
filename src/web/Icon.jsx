import React from 'react';
import ICONS from './icons.generated';
import { sx } from './style';

/**
 * react-native-vector-icons/MaterialCommunityIcons → inline SVG using the
 * same Material Design Icons set, so every icon name renders identically.
 */
export default function Icon({ name, size = 24, color = 'currentColor', style, onPress }) {
  const d = ICONS[name] || ICONS['help-circle-outline'];
  const svg = (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, ...sx(style) }}
    >
      <path d={d} fill={color} />
    </svg>
  );
  if (onPress) {
    return (
      <button type="button" className="v btn icon-btn" aria-label={name.replace(/-/g, ' ')} onClick={(e) => { e.stopPropagation(); onPress(e); }}>
        {svg}
      </button>
    );
  }
  return svg;
}
