import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Offline Request Queuing Interceptor
api.interceptors.request.use((config) => {
    const isMutation = ['post', 'put', 'patch', 'delete'].includes(config.method || '');

    if (isMutation && !navigator.onLine) {
        // Broadcast the action to OfflineContext
        const event = new CustomEvent('smartmove_offline_action', {
            detail: {
                url: config.url,
                method: config.method,
                data: config.data,
            }
        });
        window.dispatchEvent(event);

        // Return a mock response to prevent the UI from breaking/showing error
        // Note: This requires the caller to handle this "silent success" appropriately if needed
        return Promise.reject({
            isOfflineQueue: true,
            message: 'Action queued for offline sync',
            config
        });
    }
    return config;
});

export const carsApi = {
    getAll: () => api.get('/cars'),
    getById: (id: string) => api.get(`/cars/${id}`),
    create: (data: any) => api.post('/cars', data),
    update: (id: string, data: any) => api.put(`/cars/${id}`, data),
    delete: (id: string) => api.delete(`/cars/${id}`),
};

export const bookingsApi = {
    getAll: () => api.get('/bookings'),
    create: (data: any) => api.post('/bookings', data),
    updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}`, { status }),
    delete: (id: string) => api.delete(`/bookings/${id}`),
};

export const expensesApi = {
    getAll: () => api.get('/expenses'),
    create: (data: any) => api.post('/expenses', data),
    delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const pricingApi = {
    getAll: () => api.get('/pricing'),
    create: (data: any) => api.post('/pricing', data),
    update: (id: string, data: any) => api.put(`/pricing/${id}`, data),
    delete: (id: string) => api.delete(`/pricing/${id}`),
};

export const notificationsApi = {
    getAll: () => api.get('/notifications'),
    markRead: (id: string) => api.patch(`/notifications/${id}`, { is_read: true }),
    markAllRead: () => api.post('/notifications/mark-all-read'),
};

export const searchApi = {
    global: (query: string) => api.get(`/search?q=${query}`),
};

export default api;
