/**
 * AuthManager - Quản lý JWT và trạng thái đăng nhập
 */
import { dataManager } from '../core/DataManager.js';

const JWT_KEY = 'jwt';

export const AuthManager = {
  hasJWT(): boolean {
    const token = dataManager.get<string>(JWT_KEY);
    return !!token && token.length > 0;
  },

  getJWT(): string | null {
    return dataManager.get<string>(JWT_KEY);
  },

  setJWT(token: string): void {
    dataManager.set(JWT_KEY, token);
  },

  clearJWT(): void {
    dataManager.remove(JWT_KEY);
  }
};
