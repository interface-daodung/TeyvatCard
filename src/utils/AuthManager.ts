/**
 * AuthManager - Trạng thái đăng nhập qua API /me, không lưu JWT/refreshToken trong JS.
 * Server gửi jwt + refreshToken bằng HttpOnly cookie; client chỉ gọi GET /api/auth/me để biết đã đăng nhập chưa.
 */
import { ApiConfig } from './ApiConfig.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

let cachedUser: AuthUser | null = null;

export const AuthManager = {
  hasJWT(): boolean {
    return !!cachedUser;
  },

  getCachedUser(): AuthUser | null {
    return cachedUser;
  },

  setCachedUser(user: AuthUser | null): void {
    cachedUser = user;
  },

  /**
   * Gọi API GET /api/auth/me với credentials (cookie). Server đọc jwt từ cookie và trả về user.
   * Dùng để biết đã đăng nhập chưa mà không cần đọc token trong JS.
   */
  async checkAuth(): Promise<AuthUser | null> {
    try {
      const res = await fetch(ApiConfig.authMe, { credentials: 'include' });
      if (!res.ok) {
        cachedUser = null;
        if (res.status === 401) {
          const refreshed = await this.tryRefresh();
          if (refreshed) return this.checkAuth();
        }
        return null;
      }
      const data = await res.json();
      const user = data?.user as AuthUser | undefined;
      if (user?.id) {
        cachedUser = user;
        return user;
      }
      cachedUser = null;
      return null;
    } catch {
      cachedUser = null;
      return null;
    }
  },

  /** Gọi POST /api/auth/refresh (cookie refreshToken) để lấy jwt mới, không trả token về JS. */
  async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(ApiConfig.refresh, { method: 'POST', credentials: 'include' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Xóa cache và gọi logout API để server xóa cookie + refreshToken trong DB. */
  async clearAuth(): Promise<void> {
    cachedUser = null;
    try {
      await fetch(ApiConfig.logout, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
  },
};
