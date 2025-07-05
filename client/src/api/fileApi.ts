import axios from 'axios';
import { mapErrorMessage } from '../utils/mapError';

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
        const response = await apiClient.get<FileItem[]>('/api/files', {
            params: { path: path },
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = status === 404 ? 'Directory not found' : mapErrorMessage(status, error.message);
            throw new Error(message);
        }
        throw new Error('Client error');
    }
};

export const getFileContent = async (path: string): Promise<string | null> => {
    try {
        const response = await apiClient.get('/api/files/content', {
            params: { path: path },
            responseType: 'text',
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
                throw new Error('File not found');
            } else if (status === 415) {
                throw new Error('Unsupported file type for preview');
            }
            throw new Error(`File content loading error: ${error.message}`);
        }
        throw new Error('Client error');
    }
};

export const deleteFile = async (path: string): Promise<void> => {
    try {
        await apiClient.delete('/api/files', {
            params: { path: path },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
                throw new Error('File or directory not found');
            }
            throw new Error(`File deletion error: ${error.message}`);
        }
        throw new Error('Client error');
    }
};

export const renameFile = async (oldPath: string, newName: string): Promise<void> => {
    try {
        await apiClient.put('/api/files/rename', null, {
            params: { oldPath: oldPath, newName },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
                throw new Error('File or directory not found');
            }
            throw new Error(`File rename error: ${error.message}`);
        }
        throw new Error('Client error');
    }
};

export const copyFile = async (sourcePath: string, targetPath: string): Promise<void> => {
    try {
        await apiClient.post('/api/files/copy', null, {
            params: { sourcePath: sourcePath, targetPath: targetPath },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
                throw new Error('Source or target path not found');
            }
            throw new Error(`File copy error: ${error.message}`);
        }
        throw new Error('Client error');
    }
};

export const moveFile = async (sourcePath: string, targetPath: string): Promise<void> => {
    try {
        await apiClient.post('/api/files/move', null, {
            params: { sourcePath: sourcePath, targetPath: targetPath },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
                throw new Error('Source or target path not found');
            }
            throw new Error(`File move error: ${error.message}`);
        }
        throw new Error('Client error');
    }
};

export const uploadFile = async (file: File, path: string): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        if (path) formData.append('path', path);

        await apiClient.post('/api/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
                throw new Error('Target directory not found');
            }
            throw new Error(`File upload error: ${error.message}`);
        }
        throw new Error('Client error');
    }
};