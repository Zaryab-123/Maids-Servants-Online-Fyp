# Maid & Servant Online — Web

Web version of the React Native app (`myFypProject`), built with **React 19 + Vite + react-router-dom v6**.
It uses the same screens, routes, params, API calls, auth/session keys and business logic as the mobile app, with a responsive layout for desktop, tablet and mobile.

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (also exposed on your LAN)
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

Requires Node 20.19+ (or 22+).

## Backend connection (important)

* `src/assets/config.js` is unchanged from the mobile app: `SERVER_BASE = http://192.168.100.13:5150`.
  Change it to the IP/host where `Fyp_Backend` is running.
* The browser enforces **CORS**. The ASP.NET backend must allow the web origin (e.g. `http://localhost:5173`,
  or your deployed domain) in its CORS policy in `Program.cs`.
* If the site is served over **HTTPS**, the API must also be HTTPS, or the browser will block it as mixed content.
* The Map screen loads Leaflet and OpenStreetMap tiles from the internet, just like the mobile WebView did.

## Structure

| Path | What it is |
|---|---|
| `src/assets/components/**` | All screens, converted 1:1 from the RN source (same folders/names) |
| `src/assets/config.js`, `src/assets/images` | Config and images, unchanged |
| `src/web/*` | Web replacements for RN APIs: View/Text/FlatList/Modal/Switch…, AsyncStorage→localStorage, Alert→modal dialog, Toast, Geolocation, ImagePicker (file input), DateTimePicker, WebView (iframe + postMessage), MaterialCommunityIcons (@mdi/js SVGs), navigation (react-router) |
| `src/App.jsx` | Route table: same screen names as the RN stack navigator (`/Login`, `/WorkerDetailScreen`, …) |
| `src/layout/AppLayout.jsx` | Role-based sidebar (desktop) / top bar + drawer (mobile) |
| `src/styles/*` | Base, layout and responsive grid CSS |
| `tools/convert.mjs` | Codemod used to generate `src/assets/components` from the RN source (`npm run convert`, expects `../myFypProject`) |

## Navigation mapping

`navigation.navigate(name, params)` → `/name`, with params kept in history state (so objects/drafts survive),
and `goBack`/`replace`/`setParams`/`focus` listeners/`useFocusEffect` behave as in React Navigation.
Browser Back/Forward work too. Login state uses the same `localStorage` keys as the AsyncStorage keys.

## Source fixes applied during conversion

Hermes (React Native) doesn't enforce `const` temporal-dead-zone rules, but browsers do, so three spots in the
original code would crash on the web. Only statement **order** was changed:

1. `Client/ActiveRequestScreen` – `useEffect` placed after `fetchRequests` is declared.
2. `Client/ActiveRequestScreen` – `offerSent = norm === 'approved'` moved below `const norm = …`.
   (On Hermes `norm` was `undefined` here, so `offerSent` was always `false`. The intended comparison now works.)
3. `Client/WorkerDetailScreen` – focus-listener `useEffect` placed after `fetchWorkerDetails`.
