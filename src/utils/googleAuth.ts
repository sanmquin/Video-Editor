/**
 * Standard Google OAuth 2.0 Authentication Utility for YouTube Data API v3
 * Follows Google OAuth 2.0 best practices for client-side web applications (Implicit Grant / GIS flow)
 */

export interface GoogleAuthInfo {
  token: string | null;
  isValid: boolean;
  expiresAt: number | null;
  remainingMinutes: number;
}

export interface YouTubeUserProfile {
  channelId: string;
  channelTitle: string;
  customUrl?: string;
  avatarUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'yt_access_token',
  EXPIRES_AT: 'yt_token_expires_at',
  CLIENT_ID: 'yt_custom_client_id',
};

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

/**
 * Gets configured OAuth Client ID or fallback demo client ID
 */
export function getStoredClientId(): string {
  const customId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
  if (customId && customId.trim()) return customId.trim();

  const envClientId = (import.meta as any).env?.VITE_YOUTUBE_CLIENT_ID;
  if (envClientId && envClientId.trim()) return envClientId.trim();

  // Standard public Client ID for dev setup or placeholder
  return '102938475612-sample-client-id.apps.googleusercontent.com';
}

/**
 * Updates stored OAuth Client ID
 */
export function setStoredClientId(clientId: string): void {
  if (!clientId || !clientId.trim()) {
    localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
  } else {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
  }
}

/**
 * Retrieves valid access token from localStorage if present and not expired
 */
export function getStoredToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

  if (!token) return null;

  if (expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr, 10);
    if (!isNaN(expiresAt) && Date.now() >= expiresAt) {
      clearStoredToken();
      return null;
    }
  }

  return token;
}

/**
 * Returns detailed information about token validity and expiration time
 */
export function getTokenAuthInfo(): GoogleAuthInfo {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

  if (!token) {
    return { token: null, isValid: false, expiresAt: null, remainingMinutes: 0 };
  }

  if (!expiresAtStr) {
    // Legacy or demo token without explicit expiry
    return { token, isValid: true, expiresAt: null, remainingMinutes: 60 };
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) {
    return { token, isValid: true, expiresAt: null, remainingMinutes: 60 };
  }

  const now = Date.now();
  if (now >= expiresAt) {
    clearStoredToken();
    return { token: null, isValid: false, expiresAt: null, remainingMinutes: 0 };
  }

  const remainingMs = expiresAt - now;
  const remainingMinutes = Math.max(0, Math.floor(remainingMs / (1000 * 60)));

  return {
    token,
    isValid: true,
    expiresAt,
    remainingMinutes,
  };
}

/**
 * Stores OAuth access token and calculates expiration timestamp
 */
export function saveStoredToken(token: string, expiresInSeconds: number = 3600): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
}

/**
 * Clears authentication token and metadata
 */
export function clearStoredToken(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
}

/**
 * Triggers standard Google OAuth 2.0 authorization redirect flow following Google best practices
 */
export function initiateGoogleOAuthLogin(customClientId?: string): void {
  const clientId = customClientId || getStoredClientId();
  const redirectUri = window.location.origin + window.location.pathname;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', DEFAULT_SCOPES);
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('prompt', 'consent select_account');

  window.location.href = authUrl.toString();
}

/**
 * Parses OAuth 2.0 access_token from window URL hash/query on redirect callback
 */
export function parseAuthResponseFromUrl(): { token: string; expiresIn: number } | null {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) {
    return null;
  }

  try {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const expiresInStr = params.get('expires_in');
    const expiresIn = expiresInStr ? parseInt(expiresInStr, 10) : 3600;

    if (token) {
      saveStoredToken(token, expiresIn);

      // Clean up URL hash cleanly without reloading
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }

      return { token, expiresIn };
    }
  } catch (err) {
    console.error('Failed to parse OAuth redirect hash:', err);
  }

  return null;
}

/**
 * Fetches authenticated channel details from YouTube Data API v3 using the access token
 */
export async function fetchYouTubeUserProfile(token: string): Promise<YouTubeUserProfile | null> {
  if (!token || token.startsWith('demo_token')) {
    return {
      channelId: 'UC_demo_studio_cut',
      channelTitle: 'Demo YouTube Creator Channel',
      customUrl: '@studiocut_demo',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      subscriberCount: '124.8K',
      videoCount: '86'
    };
  }

  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }

    const data = await response.json();
    const item = data.items?.[0];
    if (!item) return null;

    const snippet = item.snippet || {};
    const stats = item.statistics || {};

    return {
      channelId: item.id,
      channelTitle: snippet.title || 'Connected Channel',
      customUrl: snippet.customUrl,
      avatarUrl: snippet.thumbnails?.default?.url || snippet.thumbnails?.medium?.url,
      subscriberCount: stats.subscriberCount ? Number(stats.subscriberCount).toLocaleString() : undefined,
      videoCount: stats.videoCount ? Number(stats.videoCount).toLocaleString() : undefined
    };
  } catch (err) {
    console.warn('Could not fetch YouTube user profile:', err);
    return null;
  }
}
