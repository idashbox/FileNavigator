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
            params: { path }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const mappedMessage = mapErrorMessage(status, error.message);
            throw new Error(mappedMessage);
        }
        throw new Error('Неизвестная ошибка клиента');
    }
};


export const getFileContent = async (path: string): Promise<string | null> => {
    try {
        const response = await apiClient.get('/api/files/content', { params: { path } });
        return response.data;
    } catch (error) {
        throw new Error('Ошибка загрузки содержимого файла');
    }
};
