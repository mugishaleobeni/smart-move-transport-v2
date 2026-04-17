import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authApi = {
    updateProfile: (data: any) => api.put('/auth/update-profile', data),
};

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
    getAll: (params?: { limit?: number; page?: number }) => api.get('/cars', { params }),
    getById: (id: string) => api.get(`/cars/${id}`),
    create: (data: any) => api.post('/cars', data),
    update: (id: string, data: any) => api.put(`/cars/${id}`, data),
    delete: (id: string) => api.delete(`/cars/${id}`),
};

export const bookingsApi = {
    getAll: (params?: { limit?: number; page?: number }) => api.get('/bookings', { params }),
    create: (data: any) => api.post('/bookings', data),
    update: (id: string, data: any) => api.patch(`/bookings/${id}`, data),
    updateStatus: (id: string, status: string, extraData: any = {}) => api.patch(`/bookings/${id}`, { status, ...extraData }),
    delete: (id: string) => api.delete(`/bookings/${id}`),
};

export const expensesApi = {
    getAll: (params?: { limit?: number; page?: number }) => api.get('/expenses', { params }),
    create: (data: any) => api.post('/expenses', data),
    update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
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
    testEmail: () => api.post('/notifications/test-email'),
};

export const searchApi = {
    global: (query: string) => api.get(`/search?q=${query}`),
};

export const newsletterApi = {
    subscribe: (email: string) => api.post('/newsletter/subscribe', { email }),
};

export const filesApi = {
    getFolders: (parentId?: string) => api.get('/files/folders', { params: { parent_id: parentId } }),
    createFolder: (data: { name: string; parent_id?: string }) => api.post('/files/folders', data),
    getFiles: (folderId?: string) => api.get('/files', { params: { folder_id: folderId } }),
    uploadFile: (formData: FormData) => api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteFile: (id: string) => api.delete(`/files/${id}`),
};

export const settingsApi = {
    getAgreement: () => api.get('/settings/agreement'),
    updateAgreement: (text: string) => api.post('/settings/agreement', { text }),
};

export default api;
