import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFiles, FileItem, copyFile, moveFile, forceAction } from '../api/fileApi';
import FileList from '../components/FileList';
import FileModal from '../components/FileModal';
import FileUpload from '../components/FileUpload';
import ErrorView from '../components/ErrorView';
import ConfirmModal from '../components/ConfirmModal';
import { translateError } from '../utils/errorTranslations';

const FileExplorerPage: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [viewType, setViewType] = useState<'list' | 'table'>('table');
    const [targetPath, setTargetPath] = useState('');
    const [actionType, setActionType] = useState<'copy' | 'move' | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10;

    const { '*': pathParam } = useParams();
    const navigate = useNavigate();

    // Refs для стабильных значений
    const loadingRef = useRef(loading);
    const offsetRef = useRef(offset);

    // Синхронизация refs с состоянием
    useEffect(() => {
        loadingRef.current = loading;
        offsetRef.current = offset;
    }, [loading, offset]);

    const currentPath = pathParam
        ? pathParam.replace(/^\/+|\/+$/g, '')
            .replace(/\/{2,}/g, '/')
            .replace(/\.\./g, '')
        : '';

    const breadcrumbs = currentPath ? currentPath.split('/') : [];

    const fetchFiles = useCallback(async (reset = false) => {
        if (loadingRef.current) return;

        try {
            setLoading(true);
            loadingRef.current = true;
            setError(null);
            const newOffset = reset ? 0 : offsetRef.current;
            const data = await getFiles(currentPath, newOffset, limit);

            if (reset) {
                setFiles(data);
            } else {
                setFiles(prev => [...prev, ...data]);
            }

            const newOffsetValue = newOffset + data.length;
            setOffset(newOffsetValue);
            offsetRef.current = newOffsetValue;
            setHasMore(data.length === limit);
        } catch (err) {
            setError(translateError(err));
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [currentPath]);

    const loadMoreFiles = useCallback(() => {
        fetchFiles(false);
    }, [fetchFiles]);

    useEffect(() => {
        fetchFiles(true);
    }, [currentPath, fetchFiles]);

    const refreshFiles = useCallback(async (reset = false, delay = 0) => {
        if (loadingRef.current) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                loadingRef.current = true;
                setError(null);
                const newOffset = reset ? 0 : offsetRef.current;
                const data = await getFiles(currentPath, newOffset, limit);
                setFiles(prev => reset ? data : [...prev, ...data]);
                const newOffsetValue = newOffset + data.length;
                setOffset(newOffsetValue);
                offsetRef.current = newOffsetValue;
                setHasMore(data.length === limit);
            } catch (err) {
                setError(translateError(err));
            } finally {
                setLoading(false);
                loadingRef.current = false;
            }
        };

        if (delay > 0) {
            setTimeout(fetchData, delay);
        } else {
            await fetchData();
        }
    }, [currentPath]);

    useEffect(() => {
        refreshFiles(true);

        const intervalId = setInterval(() => refreshFiles(true), 30000);
        return () => clearInterval(intervalId);
    }, [currentPath, refreshFiles]);

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

    const handleCopyMove = async () => {
        if (!selectedFile || !targetPath || !actionType) return;
        const source = currentPath ? `${currentPath}/${selectedFile.name}` : selectedFile.name;

        try {
            setError(null);
            setSuccess(null);
            const action = actionType === 'copy' ? copyFile : moveFile;
            await action(source, targetPath);
            setSuccess(`Файл успешно ${actionType === 'copy' ? 'скопирован' : 'перемещён'} в ${targetPath}`);
            setTargetPath('');
            setActionType(null);
            setSelectedFile(null);
            refreshFiles(true, 1000);
        } catch (err) {
            if (err instanceof Error && err.cause && (err.cause as any).status === 409) {
                setShowConfirmModal(true);
                setConfirmAction(() => async () => {
                    try {
                        await forceAction(actionType, source, targetPath, null, null);
                        setSuccess(`Файл успешно ${actionType === 'copy' ? 'скопирован' : 'перемещён'} в ${targetPath}`);
                        setTargetPath('');
                        setActionType(null);
                        setSelectedFile(null);
                        refreshFiles(true, 1000);
                        setShowConfirmModal(false);
                    } catch (forceErr) {
                        setError(translateError(forceErr));
                        setShowConfirmModal(false);
                    }
                });
            } else {
                setError(translateError(err));
            }
        }
    };

    const handleCancelAction = () => {
        setTargetPath('');
        setActionType(null);
        setError(null);
        setSuccess(null);
        setShowConfirmModal(false);
    };


    const isValidTargetPath = () => {
        return targetPath.trim() !== '' && !targetPath.includes('..') && !targetPath.startsWith('/');
    };

    if (error && !selectedFile && !showConfirmModal) {
        return <ErrorView message={error} onBack={() => navigate('/')} />;
    }

    return (
        <div className="file-explorer">
            <div className="navigation">
                <button onClick={handleGoUp} disabled={!currentPath} className="up-button">
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

            <FileUpload currentPath={currentPath} onUploadSuccess={() => refreshFiles(true, 1000)} />

            <FileList files={files} onClick={handleItemClick} view={viewType} />

            {hasMore && (
                <button
                    onClick={loadMoreFiles}
                    className="load-more"
                    disabled={loading}
                >
                    {loading ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
            )}


            <FileModal
                file={selectedFile}
                onClose={() => setSelectedFile(null)}
                path={currentPath}
                onActionSuccess={() => refreshFiles(true, 1000)}
            />

            {selectedFile && (
                <div className="copy-move-section">
                    <input
                        type="text"
                        value={targetPath}
                        onChange={(e) => setTargetPath(e.target.value)}
                        placeholder="Путь назначения (например, folder/subfolder)"
                    />
                    <button onClick={() => setActionType('copy')}>Копировать</button>
                    <button onClick={() => setActionType('move')}>Переместить</button>
                    {actionType && (
                        <>
                            <button onClick={handleCopyMove} disabled={!isValidTargetPath()}>
                                Подтвердить {actionType === 'copy' ? 'копирование' : 'перемещение'}
                            </button>
                            <button onClick={handleCancelAction}>Отмена</button>
                        </>
                    )}
                    {error && <p className="error">{error}</p>}
                    {success && <p className="success">{success}</p>}
                </div>
            )}

            <ConfirmModal
                isOpen={showConfirmModal}
                message={`Файл "${selectedFile?.name}" уже существует в "${targetPath}". Перезаписать?`}
                onConfirm={confirmAction}
                onCancel={handleCancelAction}
            />
        </div>
    );
};

export default FileExplorerPage;