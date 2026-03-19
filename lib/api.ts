import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const isLogin = config.url?.includes('/auth/login');
            if (token && !isLogin) {
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
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                const isDashboard = window.location.pathname.startsWith('/dashboard');
                if (isDashboard) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/?session=expired';
                }
            }
        }
        return Promise.reject(error);
    }
);
export { api };