import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFiles, FileItem } from '../api/fileApi';
import FileList from '../components/FileList';
import FileModal from '../components/FileModal';
import ErrorView from '../components/ErrorView';

const FileExplorerPage: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [viewType, setViewType] = useState<'list' | 'table'>('table');

    const { '*': pathParam } = useParams();
    const navigate = useNavigate();

    const currentPath = pathParam
        ? pathParam.replace(/^\/+|\/+$/g, '')
            .replace(/\/{2,}/g, '/')
            .replace(/\.\./g, '')
        : '';

    const breadcrumbs = currentPath ? currentPath.split('/') : [];

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getFiles(currentPath);
                setFiles(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                setError(`Failed to load files: ${message}`);
            } finally {
                setLoading(false);
            }
        };

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

    if (loading) return <div className="loading">Loading files...</div>;
    if (error) {
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

            <FileList files={files} onClick={handleItemClick} view={viewType} />

            <FileModal
                file={selectedFile}
                onClose={() => setSelectedFile(null)}
                path={currentPath}
            />
        </div>
    );
};

export default FileExplorerPage;
