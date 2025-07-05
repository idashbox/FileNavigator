import React, { useState } from 'react';
import { uploadFile } from '../api/fileApi';
import { mapApiErrorToRussian, translateError } from '../utils/errorTranslations';

interface FileUploadProps {
    currentPath: string;
    onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ currentPath, onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setError(null);
            await uploadFile(selectedFile, currentPath);
            setSelectedFile(null);
            onUploadSuccess();
        } catch (err) {
            setError(mapApiErrorToRussian(err instanceof Error ? err.message : 'Ошибка загрузки'));
        }
    };

    return (
        <div className="file-upload">
            <input
                type="file"
                onChange={handleFileChange}
                accept="*/*"
            />
            <button
                onClick={handleUpload}
                disabled={!selectedFile}
            >
                Загрузить
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default FileUpload;