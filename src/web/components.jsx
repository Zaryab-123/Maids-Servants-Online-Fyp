/**
 * Web implementations of the React Native primitives that carry behaviour
 * (lists, paging scroll views, modals, switches, spinners). Simple
 * primitives (View, Text, Image, TouchableOpacity, TextInput) are compiled
 * straight to semantic HTML elements by the conversion script.
 */
import React, {
  forwardRef, useEffect, useImperativeHandle, useRef, isValidElement, createElement,
} from 'react';
import { createPortal } from 'react-dom';
import { sx } from './style';
import { Dimensions } from './platform';

const render = (C) => (C == null ? null : isValidElement(C) ? C : createElement(C));

/* ---------------------------------------------------------------- Spinner */
export function Spinner({ size = 'small', color = '#1E64D3', animating = true, style }) {
  if (!animating) return null;
  const d = typeof size === 'number' ? size : size === 'large' ? 36 : 20;
  return (
    <span
      className="spinner"
      role="progressbar"
      aria-label="Loading"
      style={{ ...sx(style), width: d, height: d, borderColor: color, borderTopColor: 'transparent' }}
    />
  );
}

/* ---------------------------------------------------------- RefreshControl */
// Pull-to-refresh has no web equivalent; lists render an explicit
// "Refresh" button that triggers the exact same onRefresh handler.
export function RefreshControl() { return null; }

function RefreshBar({ refreshing, onRefresh }) {
  return (
    <div className="refresh-bar">
      <button type="button" className="refresh-btn" onClick={() => onRefresh && onRefresh()} disabled={refreshing}>
        {refreshing ? <Spinner size={14} color="currentColor" /> : <span aria-hidden>↻</span>}
        <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- ScrollView */
export const ScrollView = forwardRef(function ScrollView(
  {
    style, contentContainerStyle, horizontal, pagingEnabled, onMomentumScrollEnd, onScroll,
    onScrollEndDrag, refreshControl, children, scrollEnabled = true, contentClassName = '',
  },
  ref,
) {
  const el = useRef(null);
  const paging = !!(horizontal && pagingEnabled);
  // RN screens compute page offsets from Dimensions width; rescale to the
  // real container width so paging works inside any responsive layout.
  const scale = () => (paging && el.current ? el.current.clientWidth / Dimensions.get('window').width : 1);

  useImperativeHandle(ref, () => ({
    scrollTo: (a = {}, b, c) => {
      const o = typeof a === 'number' ? { y: a, x: b, animated: c } : a;
      el.current?.scrollTo({ left: (o.x || 0) * scale(), top: o.y || 0, behavior: o.animated === false ? 'auto' : 'smooth' });
    },
    scrollToEnd: (o = {}) => {
      const n = el.current;
      if (n) n.scrollTo({ left: horizontal ? n.scrollWidth : 0, top: horizontal ? 0 : n.scrollHeight, behavior: o.animated === false ? 'auto' : 'smooth' });
    },
    getScrollableNode: () => el.current,
  }));

  const timer = useRef(null);
  const evt = () => {
    const n = el.current;
    const s = scale() || 1;
    return {
      nativeEvent: {
        contentOffset: { x: n.scrollLeft / s, y: n.scrollTop },
        layoutMeasurement: { width: n.clientWidth / s, height: n.clientHeight },
        contentSize: { width: n.scrollWidth / s, height: n.scrollHeight },
      },
    };
  };
  const handleScroll = () => {
    onScroll && onScroll(evt());
    if (onMomentumScrollEnd || onScrollEndDrag) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (!el.current) return;
        onScrollEndDrag && onScrollEndDrag(evt());
        onMomentumScrollEnd && onMomentumScrollEnd(evt());
      }, 120);
    }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const cls = ['v', 'scroll', horizontal ? 'scroll-h' : '', paging ? 'pager' : '', scrollEnabled ? '' : 'no-scroll']
    .filter(Boolean).join(' ');

  return (
    <div ref={el} className={cls} style={sx(style)} onScroll={handleScroll}>
      {refreshControl && !horizontal ? <RefreshBar {...refreshControl.props} /> : null}
      <div className={`v scroll-content ${paging ? 'pager-track' : ''} ${contentClassName}`} style={sx([horizontal && { flexDirection: 'row' }, contentContainerStyle])}>
        {children}
      </div>
    </div>
  );
});

/* ---------------------------------------------------- ListView (FlatList) */
export const ListView = forwardRef(function ListView(
  {
    data = [], renderItem, keyExtractor, ListEmptyComponent, ListHeaderComponent, ListFooterComponent,
    ItemSeparatorComponent, contentContainerStyle, style, horizontal, numColumns, refreshControl,
    columnWrapperStyle, className = '', onRefresh, refreshing,
  },
  ref,
) {
  const el = useRef(null);
  useImperativeHandle(ref, () => ({
    scrollToOffset: ({ offset = 0, animated = true } = {}) => el.current?.scrollTo({ top: offset, behavior: animated ? 'smooth' : 'auto' }),
    scrollToIndex: ({ index = 0 } = {}) => el.current?.querySelectorAll(':scope > ul > li')[index]?.scrollIntoView({ behavior: 'smooth' }),
    scrollToEnd: () => el.current?.scrollTo({ top: el.current.scrollHeight, behavior: 'smooth' }),
  }));
  const items = Array.isArray(data) ? data : [];
  const rc = refreshControl ? refreshControl.props : onRefresh ? { onRefresh, refreshing } : null;
  const listCls = ['v', 'list', horizontal ? 'list-h' : '', numColumns > 1 ? 'list-cols' : '', className].filter(Boolean).join(' ');

  return (
    <div ref={el} className="v scroll list-wrap" style={sx(style)}>
      {rc && !horizontal ? <RefreshBar {...rc} /> : null}
      <div className="v" style={sx([horizontal && { flexDirection: 'row' }, contentContainerStyle])}>
        {render(ListHeaderComponent)}
        {items.length === 0 ? (
          render(ListEmptyComponent)
        ) : (
          <ul
            className={listCls}
            style={numColumns > 1 ? { gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`, ...sx(columnWrapperStyle) } : undefined}
          >
            {items.map((item, index) => {
              const key = keyExtractor ? keyExtractor(item, index) : item?.key ?? item?.id ?? index;
              return (
                <li key={key} className="v list-item">
                  {index > 0 && ItemSeparatorComponent ? render(ItemSeparatorComponent) : null}
                  {renderItem ? renderItem({ item, index, separators: {} }) : null}
                </li>
              );
            })}
          </ul>
        )}
        {render(ListFooterComponent)}
      </div>
    </div>
  );
});

/* ------------------------------------------------------- Dialog (Modal) */
export function Dialog({ visible, transparent, onRequestClose, children, animationType }) {
  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && onRequestClose) onRequestClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [visible, onRequestClose]);
  if (!visible) return null;
  return createPortal(
    <div
      className={`v modal-root ${transparent ? 'modal-transparent' : 'modal-opaque'} anim-${animationType || 'none'}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------- Toggle (Switch) */
export function Toggle({ value, onValueChange, disabled, trackColor = {}, thumbColor, style, ...rest }) {
  const on = !!value;
  return (
    <label className={`switch ${on ? 'on' : ''} ${disabled ? 'disabled' : ''}`} style={sx(style)}>
      <input
        type="checkbox"
        role="switch"
        aria-checked={on}
        aria-label={rest.accessibilityLabel || 'Toggle'}
        checked={on}
        disabled={disabled}
        onChange={(e) => onValueChange && onValueChange(e.target.checked)}
      />
      <span className="switch-track" style={{ background: on ? trackColor.true || '#1E64D3' : trackColor.false || '#CBD5E1' }}>
        <span className="switch-thumb" style={{ background: thumbColor || '#fff' }} />
      </span>
    </label>
  );
}

/* ------------------------------------------------------------ TextBox */
// Used only when a TextInput's `multiline` is decided at runtime:
// renders <textarea> or <input> accordingly.
export const TextBox = forwardRef(function TextBox({ multiline, ...props }, ref) {
  return multiline ? <textarea ref={ref} {...props} /> : <input ref={ref} {...props} />;
});
