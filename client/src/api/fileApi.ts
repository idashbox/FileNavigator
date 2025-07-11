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
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getFiles = async (path: string, offset?: number, limit?: number): Promise<FileItem[]> => {
    try {
        const response = await apiClient.get<FileItem[]>('/api/files', {
            params: { path, offset, limit },
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message ||
                (status === 404 ? 'Directory not found' :
                    status === 403 ? 'Access denied: Cannot read directory' :
                        mapErrorMessage(status, error.message));
            throw new Error(message, { cause: { status } });
        }
        throw new Error('Failed to load files');
    }
};

export const getFileContent = async (path: string): Promise<string | null> => {
    try {
        const response = await apiClient.get('/api/files/content', {
            params: { path },
            responseType: 'text',
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message ||
                (status === 404 ? 'File not found' :
                    status === 403 ? 'Access denied: Cannot read file' :
                        status === 400 ? 'Unsupported file type for preview' :
                            `Failed to load file content: ${error.message}`);
            throw new Error(message, { cause: { status } });
        }
        throw new Error('Failed to load file content');
    }
};

export const deleteFile = async (path: string): Promise<void> => {
    try {
        await apiClient.delete('/api/files', {
            params: { path },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || (status === 404 ? 'File or directory not found' : `File deletion error: ${error.message}`);
            throw new Error(message);
        }
        throw new Error('Client error');
    }
};

export const renameFile = async (oldPath: string, newName: string): Promise<void> => {
    try {
        await apiClient.put('/api/files/rename', null, {
            params: { oldPath, newName },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || (status === 404 ? 'File or directory not found' : status === 409 ? 'File already exists' : `File rename error: ${error.message}`);
            throw new Error(message, { cause: { status } });
        }
        throw new Error('Client error');
    }
};

export const copyFile = async (sourcePath: string, targetPath: string): Promise<void> => {
    try {
        await apiClient.post('/api/files/copy', null, {
            params: { sourcePath, targetPath },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || (status === 404 ? 'Source or target path not found' : status === 409 ? 'File already exists' : `File copy error: ${error.message}`);
            throw new Error(message, { cause: { status } });
        }
        throw new Error('Client error');
    }
};

export const moveFile = async (sourcePath: string, targetPath: string): Promise<void> => {
    try {
        await apiClient.post('/api/files/move', null, {
            params: { sourcePath, targetPath },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || (status === 404 ? 'Source or target path not found' : status === 409 ? 'File already exists' : `File move error: ${error.message}`);
            throw new Error(message, { cause: { status } });
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
            const message = error.response?.data?.message || (status === 404 ? 'Target directory not found' : status === 409 ? 'File already exists' : `File upload error: ${error.message}`);
            throw new Error(message, { cause: { status } });
        }
        throw new Error('Client error');
    }
};

export const forceAction = async (action: 'rename' | 'copy' | 'move' | 'upload', sourcePath: string | null, targetPath: string | null, newName: string | null, file: File | null): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('action', action);
        if (sourcePath) formData.append('sourcePath', sourcePath);
        if (targetPath) formData.append('targetPath', targetPath);
        if (newName) formData.append('newName', newName);
        if (file) formData.append('file', file);
        await apiClient.post('/api/files/force', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || (status === 404 ? 'Source or target path not found' : status === 400 ? 'Invalid action parameters' : `Forced action error: ${error.message}`);
            throw new Error(message, { cause: { status } });
        }
        throw new Error('Client error');
    }
};