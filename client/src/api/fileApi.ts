import axios from 'axios';

export interface FileItem {
    name: string;
    type: 'file' | 'directory';
    size: number;
    modified: string;
    created?: string;
}

const apiClient = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getFiles = async (path: string): Promise<FileItem[]> => {
    try {
        // Sanitize path: remove leading/trailing slashes and prevent '..' traversal
        const sanitizedPath = path
            .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
            .replace(/\.\./g, '');     // Prevent directory traversal
        console.log('Sending path to backend:', sanitizedPath);
        const response = await apiClient.get<FileItem[]>('/api/files', {
            params: {
                path: sanitizedPath || '' // Send empty string for root
            },
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message || 'Request failed';
            console.error('API Error:', error.response?.data || error.message);
            throw new Error(message);
        }
        console.error('Unexpected error:', error);
        throw new Error('An unexpected error occurred');
    }
};