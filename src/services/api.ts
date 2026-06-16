import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:62313/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  // Use a state selector if possible, or direct access from storage
  const storage = sessionStorage.getItem('himgiri-auth-storage');
  if (storage) {
    const { state } = JSON.parse(storage);
    if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// Professional Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the request explicitly requests to skip the global toast error, skip it
    if ((error.config as any)?.skipGlobalToast) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';

    switch (status) {
      case 401:
        // Unauthorized — session expired or invalid
        sessionStorage.removeItem('himgiri_token');
        sessionStorage.removeItem('himgiri_user');
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
            window.location.href = '/admin/login';
        }, 1500);
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
        // Network or unknown error (Backend is disconnected)
        if (!error.response) {
            toast.error('Server unreachable. Logging out for security.');
            sessionStorage.removeItem('himgiri-auth-storage');
            setTimeout(() => {
                window.location.href = '/admin/login';
            }, 2000);
        } else {
            toast.error(message);
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
