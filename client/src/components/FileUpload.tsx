import React, { useState } from 'react';
import { uploadFile, forceAction } from '../api/fileApi';
import { translateError } from '../utils/errorTranslations';
import ConfirmModal from './ConfirmModal';

interface FileUploadProps {
    currentPath: string;
    onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ currentPath, onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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
            if (err instanceof Error && err.cause && (err.cause as any).status === 409) {
                setShowConfirmModal(true);
            } else {
                setError(translateError(err));
            }
        }
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile) return;
        try {
            await forceAction('upload', null, currentPath, null, selectedFile);
            setSelectedFile(null);
            onUploadSuccess();
            setShowConfirmModal(false);
        } catch (err) {
            setError(translateError(err));
            setShowConfirmModal(false);
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmModal(false);
        setError(null);
    };

    return (
        <>
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
            <ConfirmModal
                isOpen={showConfirmModal}
                message={`Файл "${selectedFile?.name}" уже существует в "${currentPath}". Перезаписать?`}
                onConfirm={handleConfirmUpload}
                onCancel={handleCancelConfirm}
            />
        </>
    );
};

export default FileUpload;