// src/api.js
import axios from 'axios';

// Create and export the Axios instance
const api = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL
});

export default api;
