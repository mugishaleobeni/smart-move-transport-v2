import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
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

export default api;
