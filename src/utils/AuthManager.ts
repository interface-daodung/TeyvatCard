/**
 * AuthManager - Quản lý JWT và trạng thái đăng nhập
 */
const JWT_KEY = 'jwt';

export const AuthManager = {
  hasJWT(): boolean {
    const token = localStorage.getItem(JWT_KEY);
    return !!token && token.length > 0;
  },

  getJWT(): string | null {
    return localStorage.getItem(JWT_KEY);
  },

  setJWT(token: string): void {
    localStorage.setItem(JWT_KEY, token);
  },

  clearJWT(): void {
    localStorage.removeItem(JWT_KEY);
  }
};
