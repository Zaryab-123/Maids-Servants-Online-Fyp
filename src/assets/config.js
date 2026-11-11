// OPTION 1: Published IIS Backend (Physical Device, no port needed):
// export const SERVER_BASE = 'http://192.168.100.13/Fyp_Backend';
// export const SERVER_BASE = 'http://10.251.108.219/Fyp_Backend';


// const IP_ADDRESS = '192.168.100.13';
// const PORT = '5150';
// Web builds read the API origin from the environment so one bundle can be
// deployed anywhere:  VITE_API_BASE=http://192.168.100.13:5150 npm run build
// Falls back to the local development server used by the ASP.NET project.
const ENV_API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '';
export const SERVER_BASE = (ENV_API_BASE && String(ENV_API_BASE).trim()) || 'http://localhost:5150';



// Unused: the map is Leaflet + OpenStreetMap (see Map/Map.jsx). Kept so the
// env contract matches the mobile app.
export const GOOGLE_MAPS_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '[GCP_API_KEY]';

export const API_DASHBOARD = `${SERVER_BASE}/api/Dashboard`;
export const API_AUTH = `${SERVER_BASE}/api/Auth`;
export const API_ACCOUNT = `${SERVER_BASE}/api/AccountCreation`;
export const API_DIRECTORY = `${SERVER_BASE}/api/CompanyDirectory`;
export const API_POLICE = `${SERVER_BASE}/api/Police`;
