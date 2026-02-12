/* API base URL - game server backend */
const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  'http://localhost:3001';

const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID) ||
  '';

export const ApiConfig = {
  get googleClientId() {
    return GOOGLE_CLIENT_ID;
  },
  get baseUrl() {
    return API_BASE.replace(/\/$/, '');
  },
  get loginUser() {
    return `${this.baseUrl}/api/auth/login-user`;
  },
  get googleLogin() {
    return `${this.baseUrl}/api/auth/google`;
  },
  get payosCreateLink() {
    return `${this.baseUrl}/api/payos/create-link-game`;
  },
  getPayOrderUrl(orderCode: number) {
    return `${this.baseUrl}/api/payos/order/${orderCode}`;
  },
};
