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
        const sanitizedPath = path
            .replace(/^\/+|\/+$/g, '')
            .replace(/\.\./g, '');
        console.log('Sending path to backend:', sanitizedPath);
        const response = await apiClient.get<FileItem[]>('/api/files', {
            params: {
                path: sanitizedPath || ''
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

export const getFileContent = async (path: string): Promise<string | null> => {
    const response = await apiClient.get('/api/files/content', { params: { path } });
    return response.data;
};
