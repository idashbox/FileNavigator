import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFiles, FileItem, copyFile, moveFile } from '../api/fileApi';
import FileList from '../components/FileList';
import FileModal from '../components/FileModal';
import FileUpload from '../components/FileUpload';
import ErrorView from '../components/ErrorView';
import { mapApiErrorToRussian, translateError } from '../utils/errorTranslations';

const FileExplorerPage: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [viewType, setViewType] = useState<'list' | 'table'>('table');
    const [targetPath, setTargetPath] = useState('');
    const [actionType, setActionType] = useState<'copy' | 'move' | null>(null);

    const { '*': pathParam } = useParams();
    const navigate = useNavigate();

    const currentPath = pathParam
        ? pathParam.replace(/^\/+|\/+$/g, '')
            .replace(/\/{2,}/g, '/')
            .replace(/\.\./g, '')
        : '';

    const breadcrumbs = currentPath ? currentPath.split('/') : [];

    useEffect(() => {
        fetchFiles();
    }, [currentPath]);

    const handleItemClick = (file: FileItem) => {
        if (file.type === 'directory') {
            const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
            navigate(`/files/${newPath}`);
        } else {
            setSelectedFile(file);
        }
    };

    const handleGoUp = () => {
        if (!currentPath) return;
        const segments = currentPath.split('/');
        segments.pop();
        const parentPath = segments.join('/');
        navigate(parentPath ? `/files/${parentPath}` : '/');
    };

    const handleBreadcrumbClick = (index: number) => {
        const newPath = breadcrumbs.slice(0, index + 1).join('/');
        navigate(`/files/${newPath}`);
    };

    const fetchFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const data = await getFiles(currentPath);
            setFiles(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(mapApiErrorToRussian(`Failed to load files: ${message}`));
        } finally {
            setLoading(false);
        }
    };

    const handleCopyMove = async () => {
        if (!selectedFile || !targetPath || !actionType) return;
        try {
            setError(null);
            setSuccess(null);
            const source = currentPath ? `${currentPath}/${selectedFile.name}` : selectedFile.name;
            const action = actionType === 'copy' ? copyFile : moveFile;
            await action(source, targetPath);
            setSuccess(`Файл успешно ${actionType === 'copy' ? 'скопирован' : 'перемещён'} в ${targetPath}`);
            setTargetPath('');
            setActionType(null);
            setSelectedFile(null);
            fetchFiles();
        } catch (err) {
            const actionName = actionType === 'copy' ? 'копирования' : 'перемещения';
            setError(mapApiErrorToRussian(err instanceof Error ? err.message : `Ошибка ${actionName}`));
        }
    };

    const handleCancelAction = () => {
        setTargetPath('');
        setActionType(null);
        setError(null);
        setSuccess(null);
    };

    const isValidTargetPath = () => {
        return targetPath.trim() !== '' && !targetPath.includes('..') && !targetPath.startsWith('/');
    };

    if (loading) return <div className="loading">Loading files...</div>;
    if (error && !selectedFile) {
        return (
            <ErrorView
                message={error}
                onBack={() => navigate('/')}
            />
        );
    }

    return (
        <div className="file-explorer">
            <div className="navigation">
                <button
                    onClick={handleGoUp}
                    disabled={!currentPath}
                    className="up-button"
                >
                    ↑ Up
                </button>
                <h2>Current Path: /{currentPath || 'Root'}</h2>
            </div>

            <div className="breadcrumbs">
                <span onClick={() => navigate('/')}>Root</span>
                {breadcrumbs.map((segment, index) => (
                    <span key={index} onClick={() => handleBreadcrumbClick(index)}>
                        {' / '}{segment}
                    </span>
                ))}
            </div>

            <div className="view-toggle">
                <button onClick={() => setViewType(viewType === 'table' ? 'list' : 'table')}>
                    Переключить на {viewType === 'table' ? 'список' : 'таблицу'}
                </button>
            </div>

            <FileUpload currentPath={currentPath} onUploadSuccess={fetchFiles} />

            <FileList files={files} onClick={handleItemClick} view={viewType} />

            <FileModal
                file={selectedFile}
                onClose={() => setSelectedFile(null)}
                path={currentPath}
                onActionSuccess={fetchFiles}
            />

            {selectedFile && (
                <div className="copy-move-section">
                    <input
                        type="text"
                        value={targetPath}
                        onChange={(e) => setTargetPath(e.target.value)}
                        placeholder="Путь назначения (например, folder/subfolder)"
                    />
                    <button onClick={() => setActionType('copy')}>
                        Копировать
                    </button>
                    <button onClick={() => setActionType('move')}>
                        Переместить
                    </button>
                    {actionType && (
                        <>
                            <button
                                onClick={handleCopyMove}
                                disabled={!isValidTargetPath()}
                            >
                                Подтвердить {actionType === 'copy' ? 'копирование' : 'перемещение'}
                            </button>
                            <button onClick={handleCancelAction}>
                                Отмена
                            </button>
                        </>
                    )}
                    {error && <p className="error">{error}</p>}
                    {success && <p className="success">{success}</p>}
                </div>
            )}
        </div>
    );
};

export default FileExplorerPage;

