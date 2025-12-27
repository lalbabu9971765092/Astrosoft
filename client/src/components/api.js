// src/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL
});

api.interceptors.request.use((config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const token = JSON.parse(userInfo).token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    // Attach global house rotation if present in localStorage for POST/PUT requests
    try {
        const storedRotation = localStorage.getItem('house_to_rotate');
        if (storedRotation && (config.method === 'post' || config.method === 'put')) {
            let data = config.data || {};
            if (typeof data === 'object' && !Array.isArray(data)) {
                // avoid overwriting if already present
                if (data.house_to_rotate === undefined) data.house_to_rotate = parseInt(storedRotation, 10);
                config.data = data;
            }
        }
    } catch (e) { /* ignore */ }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
