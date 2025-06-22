import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFiles, FileItem } from '../api/fileApi';

const FileExplorerPage: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { '*': pathParam } = useParams();
    const navigate = useNavigate();

    const currentPath = pathParam
        ? pathParam.replace(/^\/+|\/+$/g, '')
            .replace(/\/{2,}/g, '/')
            .replace(/\.\./g, '')
        : '';

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Fetching files for path:', currentPath);
                const data = await getFiles(currentPath);
                console.log('Received files:', data);
                setFiles(data);
            } catch (err) {
                console.error('Full error:', err);
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
            // Формируем путь с учётом текущей позиции
            const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
            console.log('Navigating to:', newPath);
            navigate(`/files/${newPath}`);
        }
    };

    const handleGoUp = () => {
        if (!currentPath) return;

        const pathSegments = currentPath.split('/');
        pathSegments.pop();
        const parentPath = pathSegments.join('/');
        console.log('Going up to:', parentPath);
        navigate(parentPath ? `/files/${parentPath}` : '/');
    };

    if (loading) return <div className="loading">Loading files...</div>;
    if (error) return (
        <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
        </div>
    );

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

            <ul className="file-list">
                {files.length === 0 ? (
                    <li className="empty">No files found</li>
                ) : (
                    files.map((file) => (
                        <li
                            key={`${file.type}-${file.name}`}
                            className={`file-item ${file.type}`}
                            onClick={() => handleItemClick(file)}
                        >
                            <span className="icon">
                                {file.type === 'directory' ? '📁' : '📄'}
                            </span>
                            <span className="name">{file.name}</span>
                            <span className="size">{file.size} bytes</span>
                            <span className="modified">
                                {new Date(file.modified).toLocaleString()}
                            </span>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default FileExplorerPage;