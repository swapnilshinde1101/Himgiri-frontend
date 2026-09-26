import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:62313/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  // Access store state directly (in-memory) instead of parsing storage on every request
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function forceLogoutToLogin() {
  sessionStorage.removeItem('himgiri-auth-storage');
  if (window.location.pathname.startsWith('/admin')) {
    toast.error('Session expired. Please login again.');
    setTimeout(() => {
        window.location.href = '/admin/login';
    }, 1500);
  }
}

// Access tokens are short-lived (15 min) by design — this makes that invisible to the
// user by silently exchanging the refresh token for a new pair on the first 401 and
// retrying the original request, instead of forcing a re-login every 15 minutes.
// A single in-flight refresh is shared across any requests that 401 concurrently,
// rather than each one triggering its own refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().user?.refreshToken;
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // Lazy import avoids a circular dependency (authService imports this module).
        const { authService } = await import('./authService');
        const result = await authService.refresh(refreshToken);
        useAuthStore.getState().updateTokens(result.token, result.refreshToken, result.expiresAt);
        return result.token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

// Professional Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    // Attempt a silent refresh-and-retry BEFORE the skipGlobalToast short-circuit below —
    // this must be reachable independent of that flag (which login/refresh/logout also
    // set, for the unrelated reason of suppressing their own toasts). skipAuthRefresh is
    // the actual, dedicated guard against a nested refresh attempting to refresh itself.
    if (status === 401 && originalRequest && !originalRequest._retriedAfterRefresh && !originalRequest.skipAuthRefresh) {
      originalRequest._retriedAfterRefresh = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    // If the request explicitly requests to skip the global toast error, skip it
    if ((error.config as any)?.skipGlobalToast) {
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'Something went wrong';

    switch (status) {
      case 401:
        // Either the refresh attempt above failed, this request already retried once,
        // or it was excluded from refreshing entirely — the session is genuinely over.
        forceLogoutToLogin();
        break;

      case 403:
        // Forbidden — no access to this specific resource
        toast.error('Access denied. You do not have permission for this action.');
        break;

      case 400:
      case 404:
      case 409:
      case 422:
        // Client-side and business logic errors
        toast.error(message);
        break;

      case 500:
        // Server Error
        toast.error('Server error. Please try again later.');
        break;

      default:
        // Network or unknown error (Backend is disconnected or transient offline)
        if (!error.response) {
            toast.error('Network connection issue. Please check your internet connection.');
        } else {
            toast.error(message);
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
