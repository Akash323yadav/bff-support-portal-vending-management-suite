import axios from "axios";

// Helper to auto-upgrade to HTTPS if current page is secure
const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// OPTIONAL: request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// OPTIONAL: response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
