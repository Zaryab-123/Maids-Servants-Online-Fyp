/**
 * React Native → React DOM conversion script.
 *
 * Uses the Babel AST to locate JSX + imports, then applies *surgical* text
 * edits (magic-string) so all business logic, API calls, state and comments
 * remain byte-for-byte identical. Only presentation primitives change:
 *
 *   View / SafeAreaView / KeyboardAvoidingView → <div>
 *   Text                                      → <span>
 *   TouchableOpacity & friends                → <button type="button">
 *   Image                                     → <img>
 *   TextInput                                 → <input> / <textarea>
 *   ScrollView (plain)                        → <div> + content <div>
 *   StatusBar                                 → removed (no web meaning)
 *   FlatList / Modal / Switch / ActivityIndicator / paging ScrollView
 *                                             → web components in src/web
 *
 * Usage: node tools/convert.mjs <srcDir> <outDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import MagicString from 'magic-string';

const traverse = _traverse.default || _traverse;
const [, , SRC, OUT] = process.argv;

const MODULE_MAP = {
  '@react-native-async-storage/async-storage': '@/web/AsyncStorage',
  'react-native-vector-icons/MaterialCommunityIcons': '@/web/Icon',
  '@react-native-community/datetimepicker': '@/web/DateTimePicker',
  '@react-navigation/native': '@/web/navigation',
  '@react-native-community/geolocation': '@/web/Geolocation',
  'react-native-webview': '@/web/WebView',
  'react-native-toast-message': '@/web/Toast',
  'react-native-image-picker': '@/web/ImagePicker',
};

const HTML = {
  View: { tag: 'div', cls: 'v' },
  SafeAreaView: { tag: 'div', cls: 'v screen' },
  KeyboardAvoidingView: { tag: 'div', cls: 'v' },
  Text: { tag: 'span', cls: 't' },
  TouchableOpacity: { tag: 'button', cls: 'v btn' },
  TouchableHighlight: { tag: 'button', cls: 'v btn' },
  TouchableWithoutFeedback: { tag: 'button', cls: 'v btn' },
  Pressable: { tag: 'button', cls: 'v btn' },
  Image: { tag: 'img', cls: 'img' },
  TextInput: { tag: 'input', cls: 'input' },
  ScrollView: { tag: 'div', cls: 'v scroll' },
};
const COMPONENTS = {
  ActivityIndicator: 'Spinner',
  FlatList: 'ListView',
  Modal: 'Dialog',
  Switch: 'Toggle',
  RefreshControl: 'RefreshControl',
};
const COMPLEX_SCROLL = new Set(['horizontal', 'pagingEnabled', 'ref', 'refreshControl', 'onScroll', 'onMomentumScrollEnd', 'scrollEnabled', 'onScrollEndDrag']);

const DROP = new Set([
  'activeOpacity', 'hitSlop', 'showsVerticalScrollIndicator', 'showsHorizontalScrollIndicator',
  'keyboardShouldPersistTaps', 'nestedScrollEnabled', 'bounces', 'behavior', 'keyboardVerticalOffset',
  'textAlignVertical', 'underlineColorAndroid', 'selectionColor', 'cursorColor', 'accessibilityRole',
  'accessible', 'accessibilityHint', 'importantForAccessibility', 'onLayout', 'resizeMethod',
  'defaultSource', 'ellipsizeMode', 'selectable', 'delayPressIn', 'underlayColor', 'blurOnSubmit',
  'keyboardAppearance', 'contextMenuHidden', 'fadeDuration', 'progressiveRenderingEnabled',
  'overScrollMode', 'decelerationRate', 'scrollEventThrottle', 'allowFontScaling', 'adjustsFontSizeToFit',
]);
const TIN = new Set(['secureTextEntry', 'keyboardType', 'autoCapitalize', 'autoCorrect', 'editable', 'returnKeyType', 'autoComplete']);
const PASS = new Set(['key', 'ref', 'disabled', 'placeholder', 'maxLength', 'autoFocus', 'onFocus', 'onBlur', 'onError', 'onLoad', 'value', 'id', 'title']);

const GRID_LISTS = new Set(['filteredRequests', 'displayedReviews', 'reviews', 'filteredDecisions', 'acceptedRequests', 'requests', 'filteredJobs', 'reviewsList']);
const report = {};
const note = (file, msg) => { (report[file] ||= new Set()).add(msg); };

function valueSrc(code, attr) {
  if (!attr.value) return 'true';
  if (attr.value.type === 'StringLiteral') return JSON.stringify(attr.value.value);
  if (attr.value.type === 'JSXExpressionContainer') return code.slice(attr.value.expression.start, attr.value.expression.end);
  return code.slice(attr.value.start, attr.value.end);
}
const exprOf = (attr) => (attr.value && attr.value.type === 'JSXExpressionContainer' ? attr.value.expression : null);

// Minimal, documented fixes for temporal-dead-zone errors in the original
// source. React Native's Hermes engine does not enforce TDZ, so these were
// silent there; browsers throw and the screen would crash. Only statement
// ORDER changes — no logic is added or removed.
const PATCHES = {
  'Client/ActiveRequestScreen.js': [
    {
      why: 'useEffect read fetchRequests before its const declaration',
      cut: /\n\s*useEffect\(\(\) => \{\n\s*fetchRequests\(\);\n\s*\}, \[fetchRequests\]\);\n/,
      after: /const fetchRequests = useCallback\([\s\S]*?\n    \}, \[\]\);\n/,
    },
    {
      why: '`norm` was read one line before `const norm` was declared',
      cut: /\n(\s*)const offerSent = norm === 'approved';/,
      after: /const norm = rawStatus\.toLowerCase\(\);/,
    },
  ],
  'Client/WorkerDetailScreen.js': [
    {
      why: 'focus-listener useEffect read fetchWorkerDetails before its const declaration',
      cut: /\n\s*useEffect\(\(\) => \{\n\s*const unsubscribe = navigation\.addListener\('focus', \(\) => \{\n\s*fetchWorkerDetails\(\);\n\s*\}\);\n\s*return unsubscribe;\n\s*\}, \[navigation, fetchWorkerDetails\]\);\n/,
      after: /const fetchWorkerDetails = useCallback\([\s\S]*?\n    \}, \[workerId, navigation\]\);\n/,
    },
  ],
};

function applyPatches(code, rel) {
  for (const p of PATCHES[rel.replace(/\\/g, '/')] || []) {
    const m = code.match(p.cut);
    if (!m) { note(rel, `patch NOT applied: ${p.why}`); continue; }
    code = code.replace(p.cut, '\n');
    const a = code.match(p.after);
    if (!a) { note(rel, `patch anchor missing: ${p.why}`); continue; }
    const at = a.index + a[0].length;
    code = code.slice(0, at) + m[0].replace(/^\n/, '\n') + code.slice(at);
    note(rel, `patched: ${p.why}`);
  }
  return code;
}

function convertFile(file, relName) {
  const code = applyPatches(fs.readFileSync(file, 'utf8'), relName);
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true });
  const s = new MagicString(code);

  const rnNames = new Set(); // non-JSX names imported from react-native
  const webNeeds = new Set(['sx']);
  const imgImports = new Map(); // path -> identifier

  // Web-first layout: containers that render card collections via .map()
  // get a `card-grid` class → responsive multi-column grid on wide screens.
  const gridContainers = new Set();
  const gridItems = new Set();
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      if (c.type === 'MemberExpression' && c.property.name === 'map' && c.object.type === 'Identifier' && GRID_LISTS.has(c.object.name)) {
        const host = p.findParent((x) => x.isJSXElement());
        if (host) gridContainers.add(host.node);
        const cb = p.get('arguments.0');
        if (cb && cb.node) {
          cb.traverse({
            JSXElement(q) {
              if (q.findParent((x) => x.isJSXElement() || x === cb) === cb) gridItems.add(q.node);
              q.skip();
            },
          });
        }
      }
    },
  });

  traverse(ast, {
    ImportDeclaration(p) {
      const src = p.node.source.value;
      if (src === 'react-native') {
        for (const sp of p.node.specifiers) rnNames.add(sp.local.name);
        s.remove(p.node.start, p.node.end);
      } else if (src.startsWith('.') && /\.js$/.test(src)) {
        s.overwrite(p.node.source.start, p.node.source.end, `'${src.replace(/\.js$/, '')}'`);
      } else if (MODULE_MAP[src]) {
        s.overwrite(p.node.source.start, p.node.source.end, `'${MODULE_MAP[src]}'`);
      }
    },

    CallExpression(p) {
      const n = p.node;
      if (n.callee.type === 'Identifier' && n.callee.name === 'require' && n.arguments[0]?.type === 'StringLiteral') {
        const target = n.arguments[0].value;
        const inDropped = p.findParent((x) => x.isJSXAttribute() && DROP.has(x.node.name.name));
        if (inDropped) return; // attribute is removed entirely
        if (/\.(png|jpe?g|gif|svg|webp)$/i.test(target)) {
          let id = imgImports.get(target);
          if (!id) {
            id = `__img_${path.basename(target).replace(/\W/g, '_')}`;
            imgImports.set(target, id);
          }
          s.overwrite(n.start, n.end, id);
        }
      }
    },

    JSXElement(p) {
      const el = p.node;
      const open = el.openingElement;
      if (open.name.type !== 'JSXIdentifier') return;
      const name = open.name.name;
      const attrs = open.attributes.filter((a) => a.type === 'JSXAttribute');
      const byName = Object.fromEntries(attrs.map((a) => [a.name.name, a]));

      // ---------------- StatusBar: no web equivalent
      if (name === 'StatusBar' && rnNames.has('StatusBar')) {
        s.overwrite(el.start, el.end, 'null');
        // wrap in braces when used as a JSX child
        if (p.parent.type === 'JSXElement' || p.parent.type === 'JSXFragment') s.overwrite(el.start, el.end, '');
        return;
      }

      // ---------------- behavioural components → web components
      const isComplexScroll = name === 'ScrollView' && attrs.some((a) => COMPLEX_SCROLL.has(a.name.name));
      if ((COMPONENTS[name] && rnNames.has(name)) || (isComplexScroll && rnNames.has('ScrollView'))) {
        const target = isComplexScroll ? 'ScrollView' : COMPONENTS[name];
        webNeeds.add(target);
        if (target !== name) {
          s.overwrite(open.name.start, open.name.end, target);
          if (el.closingElement) s.overwrite(el.closingElement.name.start, el.closingElement.name.end, target);
        }
        for (const a of attrs) if (DROP.has(a.name.name)) s.remove(a.start, a.end);
        if (gridContainers.has(el) && target === 'ScrollView') s.appendLeft(open.name.end, ' contentClassName="card-grid"');
        return;
      }

      const spec = HTML[name];
      if (!spec || !rnNames.has(name)) return;

      let tag = spec.tag;
      let dynamicMultiline = false;
      if (name === 'TextInput' && byName.multiline) {
        const mv = valueSrc(code, byName.multiline);
        if (mv === 'true') tag = 'textarea';
        else if (mv !== 'false') { tag = 'TextBox'; dynamicMultiline = true; webNeeds.add('TextBox'); }
      }

      s.overwrite(open.name.start, open.name.end, tag);
      if (el.closingElement) s.overwrite(el.closingElement.name.start, el.closingElement.name.end, tag);

      const grid = gridContainers.has(el);
      let inject = ` className="${spec.cls}${grid && name !== 'ScrollView' ? ' card-grid' : ''}${gridItems.has(el) ? ' grid-item' : ''}"`;
      if (tag === 'button') inject += ' type="button"';
      if (tag === 'img') inject += ' alt=""';

      // Extra style fragments that must merge into the style prop
      const extra = [];
      let lines = null;
      let phColor = null;
      const tin = [];

      for (const a of attrs) {
        const an = a.name.name;
        const ex = exprOf(a);
        if (an === 'style') continue; // handled below
        if (DROP.has(an)) { s.remove(a.start, a.end); continue; }

        if (an === 'onPress' || an === 'onLongPress') {
          if (an === 'onLongPress') { s.overwrite(a.name.start, a.name.end, 'onContextMenu'); }
          else s.overwrite(a.name.start, a.name.end, 'onClick');
          if (ex) { s.appendLeft(ex.start, 'press('); s.prependRight(ex.end, ')'); webNeeds.add('press'); }
          continue;
        }
        if (an === 'numberOfLines') {
          if (name === 'Text') { lines = valueSrc(code, a); s.remove(a.start, a.end); }
          else { s.overwrite(a.name.start, a.name.end, 'rows'); }
          continue;
        }
        if (an === 'multiline') { if (!dynamicMultiline) s.remove(a.start, a.end); continue; }
        if (an === 'accessibilityLabel') { s.overwrite(a.name.start, a.name.end, 'aria-label'); continue; }
        if (an === 'testID') { s.overwrite(a.name.start, a.name.end, 'data-testid'); continue; }
        if (an === 'pointerEvents') { extra.push(`{ pointerEvents: ${valueSrc(code, a)} === 'none' ? 'none' : undefined }`); s.remove(a.start, a.end); continue; }

        if (name === 'Image') {
          if (an === 'source') {
            s.overwrite(a.name.start, a.name.end, 'src');
            if (ex) { s.appendLeft(ex.start, 'imgSrc('); s.prependRight(ex.end, ')'); webNeeds.add('imgSrc'); }
            continue;
          }
          if (an === 'resizeMode') {
            extra.push(`{ objectFit: RESIZE[${valueSrc(code, a)}] }`);
            webNeeds.add('RESIZE');
            s.remove(a.start, a.end);
            continue;
          }
          if (an === 'blurRadius' || an === 'tintColor') { s.remove(a.start, a.end); continue; }
        }

        if (name === 'TextInput') {
          if (an === 'onChangeText') {
            s.overwrite(a.name.start, a.name.end, 'onChange');
            if (ex) { s.appendLeft(ex.start, 'changeText('); s.prependRight(ex.end, ')'); webNeeds.add('changeText'); }
            continue;
          }
          if (an === 'onSubmitEditing') {
            s.overwrite(a.name.start, a.name.end, 'onKeyDown');
            if (ex) { s.appendLeft(ex.start, 'submitOnEnter('); s.prependRight(ex.end, ')'); webNeeds.add('submitOnEnter'); }
            continue;
          }
          if (an === 'value' && ex) { s.appendLeft(ex.start, '('); s.prependRight(ex.end, ") ?? ''"); continue; }
          if (an === 'placeholderTextColor') { phColor = valueSrc(code, a); s.remove(a.start, a.end); continue; }
          if (TIN.has(an)) { tin.push(`${an}: ${valueSrc(code, a)}`); s.remove(a.start, a.end); continue; }
        }

        if (name === 'ScrollView' && an === 'contentContainerStyle') continue; // handled below
        if (!PASS.has(an) && !(an.startsWith('on') && tag !== 'span')) note(relName, `<${name}> kept attribute "${an}"`);
      }

      if (tin.length) { inject += ` {...tin({ ${tin.join(', ')} })}`; webNeeds.add('tin'); }

      // ----- style prop
      const styleAttr = byName.style;
      const styleExpr = styleAttr && exprOf(styleAttr);
      const wrapOpen = (inner) => {
        let o = extra.length ? 'sx([' : 'sx(';
        return phColor ? `{ ...${o}` : o;
      };
      const wrapClose = () => {
        let c = extra.length ? `, ${extra.join(', ')}]` : '';
        c += lines ? `, ${lines})` : ')';
        if (phColor) c += `, '--ph': ${phColor} }`;
        return c;
      };
      if (styleExpr) {
        s.appendLeft(styleExpr.start, wrapOpen());
        s.prependRight(styleExpr.end, wrapClose());
      } else if (extra.length || lines || phColor) {
        const base = extra.length ? `sx([null, ${extra.join(', ')}]${lines ? `, ${lines}` : ''})` : `sx(null${lines ? `, ${lines}` : ''})`;
        inject += ` style={${phColor ? `{ ...${base}, '--ph': ${phColor} }` : base}}`;
      }

      // ----- plain ScrollView: RN renders an inner content container
      if (name === 'ScrollView') {
        const cc = byName.contentContainerStyle;
        const ccSrc = cc ? valueSrc(code, cc) : null;
        if (cc) s.remove(cc.start, cc.end);
        if (!open.selfClosing && el.closingElement) {
          s.appendLeft(open.end, `<div className="v scroll-content${grid ? ' card-grid' : ''}"${ccSrc ? ` style={sx(${ccSrc})}` : ''}>`);
          s.prependRight(el.closingElement.start, '</div>');
        }
      }

      s.appendLeft(open.name.end, inject);
    },
  });

  // ------------ imports
  const WEB_API = ['StyleSheet', 'Platform', 'Dimensions', 'Alert', 'PermissionsAndroid', 'Keyboard'];
  for (const n of rnNames) {
    if (WEB_API.includes(n)) webNeeds.add(n);
    else if (!HTML[n] && !COMPONENTS[n] && n !== 'StatusBar' && n !== 'ScrollView') note(relName, `unmapped react-native import "${n}"`);
  }
  let header = rnNames.size ? `import { ${[...webNeeds].sort().join(', ')} } from '@/web';\n` : '';
  for (const [p, id] of imgImports) header += `import ${id} from '${p}';\n`;

  // Insert after the last import declaration
  const imports = ast.program.body.filter((n) => n.type === 'ImportDeclaration');
  const at = imports.length ? imports[imports.length - 1].end : 0;
  if (header) s.appendLeft(at, `\n${header}`);

  return s.toString();
}

// ------------ walk
let count = 0;
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const rel = path.relative(SRC, full);
    const dest = path.join(OUT, rel.replace(/\.js$/, '.jsx'));
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (/\.js$/.test(f)) {
      const src = fs.readFileSync(full, 'utf8');
      const isReact = /from ['"]react-native['"]|<[A-Z]/.test(src);
      fs.writeFileSync(isReact ? dest : dest.replace(/\.jsx$/, '.js'), convertFile(full, rel));
      count++;
    } else {
      fs.copyFileSync(full, dest);
    }
  }
}
walk(SRC);
console.log(`Converted ${count} files.`);
for (const [f, msgs] of Object.entries(report)) console.log(`\n${f}\n  - ${[...msgs].join('\n  - ')}`);
