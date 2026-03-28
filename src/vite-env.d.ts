/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_IS_DEV?: string;
  /** `true`: khi gửi client-log-error thất bại, log ra console (dùng khi test preview + API local). */
  readonly VITE_DEBUG_CLIENT_LOG?: string;
  readonly VITE_STORAGE_SECRET_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface CredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: CredentialResponse) => void;
      [key: string]: unknown;
    }) => void;
    renderButton: (
      element: HTMLElement,
      config: { type?: string; theme?: string; size?: string; width?: string; text?: string; [key: string]: unknown }
    ) => void;
  };
}

interface Google {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: Google;
  }
}

export {};
