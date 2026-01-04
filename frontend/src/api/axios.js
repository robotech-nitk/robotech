import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// INTERCEPTOR MUST COME BEFORE EXPORT
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const errorPages = ["/403", "/500", "/offline"];

    if (!error.response && !errorPages.includes(currentPath)) {
      window.location.href = "/offline";
    } 
    else if (status === 403 && !errorPages.includes(currentPath)) {
      window.location.href = "/403";
    } 
    else if (status >= 500 && !errorPages.includes(currentPath)) {
      window.location.href = "/500";
    }

    return Promise.reject(error); // ✅ now LEGAL
  }
);

// EXPORT MUST BE LAST
export default api;
