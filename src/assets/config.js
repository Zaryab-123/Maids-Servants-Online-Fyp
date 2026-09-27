// OPTION 1: Published IIS Backend (Physical Device, no port needed):
// export const SERVER_BASE = 'http://192.168.100.13/Fyp_Backend';
// export const SERVER_BASE = 'http://10.251.108.219/Fyp_Backend';


// const IP_ADDRESS = '192.168.100.13';
// const PORT = '5150';
export const SERVER_BASE = 'http://localhost:5150';



export const GOOGLE_MAPS_API_KEY = '[GCP_API_KEY]';

export const API_DASHBOARD = `${SERVER_BASE}/api/Dashboard`;
export const API_AUTH = `${SERVER_BASE}/api/Auth`;
export const API_ACCOUNT = `${SERVER_BASE}/api/AccountCreation`;
export const API_DIRECTORY = `${SERVER_BASE}/api/CompanyDirectory`;
export const API_POLICE = `${SERVER_BASE}/api/Police`;
