import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { sx } from './style';

/**
 * react-native-webview → sandboxed <iframe srcdoc>.
 * A bridge exposes window.ReactNativeWebView.postMessage inside the frame so
 * the original embedded Leaflet map script works unchanged; messages are
 * delivered to onMessage as { nativeEvent: { data } } like on native.
 */
const BRIDGE = `<script>window.ReactNativeWebView={postMessage:function(d){parent.postMessage({__rnwv:window.name,data:d},'*');}};<\/script>`;

export const WebView = forwardRef(function WebView(
  { source = {}, style, onMessage, onLoadEnd, startInLoadingState, renderLoading },
  ref,
) {
  const frame = useRef(null);
  const id = useMemo(() => `wv${Math.random().toString(36).slice(2)}`, []);
  const [loading, setLoading] = useState(true);

  const html = useMemo(() => {
    if (!source.html) return undefined;
    return source.html.includes('<head>') ? source.html.replace('<head>', `<head>${BRIDGE}`) : BRIDGE + source.html;
  }, [source.html]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data && e.data.__rnwv === id && onMessage) onMessage({ nativeEvent: { data: e.data.data } });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [id, onMessage]);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (js) => { try { frame.current?.contentWindow?.eval(js); } catch (e) { /* sandboxed */ } },
    postMessage: (d) => frame.current?.contentWindow?.postMessage(d, '*'),
    reload: () => { if (frame.current) frame.current.srcdoc = html; },
  }));

  return (
    <div className="v webview" style={sx(style)}>
      <iframe
        ref={frame}
        name={id}
        title="Map"
        srcDoc={html}
        src={html ? undefined : source.uri}
        sandbox="allow-scripts allow-same-origin allow-popups"
        onLoad={() => { setLoading(false); onLoadEnd && onLoadEnd(); }}
      />
      {startInLoadingState && loading && renderLoading ? <div className="webview-loading">{renderLoading()}</div> : null}
    </div>
  );
});

export default WebView;
