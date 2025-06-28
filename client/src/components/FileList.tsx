import React from 'react';
import { FileItem } from '../api/fileApi';
import './FileList.css';

interface FileListProps {
    files: FileItem[];
    onClick: (file: FileItem) => void;
    view: 'list' | 'table';
}

const FileList: React.FC<FileListProps> = ({ files, onClick, view }) => {
    if (view === 'table') {
        return (
            <table className="file-table">
                <thead>
                <tr>
                    <th>Тип</th>
                    <th>Имя</th>
                    <th>Размер</th>
                    <th>Создан</th>
                    <th>Изменён</th>
                </tr>
                </thead>
                <tbody>
                {files.map((file) => (
                    <tr key={file.name} onClick={() => onClick(file)}>
                        <td>{file.type === 'directory' ? '📁' : '📄'}</td>
                        <td>{file.name}</td>
                        <td>{file.size}</td>
                        <td>{file.created}</td>
                        <td>{file.modified}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    }

    return (
        <ul className="file-list">
            {files.map(file => (
                <li key={file.name} onClick={() => onClick(file)}>
                    {file.type === 'directory' ? '📁' : '📄'} {file.name}
                </li>
            ))}
        </ul>
    );
};

export default FileList;
