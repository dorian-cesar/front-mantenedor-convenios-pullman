import axios from "axios";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.defaults.headers.common["Content-Type"] = "application/json";
api.defaults.headers.common["Accept"] = "application/json";

api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            let token = localStorage.getItem("token");
            
            if (!token) {
            }
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message,
        });

        if (error.code === "ERR_NETWORK") {
            console.error("Network error - check CORS or backend availability");
        }

        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                window.location.href = "/?session=expired";
            }
        }
        return Promise.reject(error);
    }
);