import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { FileItem } from '../api/fileApi';
import { getFileContent } from '../api/fileApi';
import { formatDate } from '../utils/formatDate';
import { formatSize } from '../utils/formatSize';

interface Props {
    file: FileItem | null;
    onClose: () => void;
    path: string;
}

const FileModal: React.FC<Props> = ({ file, onClose, path }) => {
    const [content, setContent] = useState<string | null>(null);

    useEffect(() => {
        if (file && file.type === 'file') {
            getFileContent(`${path}/${file.name}`).then(setContent).catch(() => setContent('Ошибка чтения'));
        }
    }, [file]);

    if (!file) return null;

    return (
        <Modal isOpen={!!file} onRequestClose={onClose} contentLabel="File Info">
            <h2>{file.name}</h2>
            <p><strong>Размер:</strong> {formatSize(file.size)} байт</p>
            <p><strong>Создан:</strong> {file.created ? formatDate(file.created) : '-'}</p>
            <p><strong>Изменён:</strong> {formatDate(file.modified)}</p>
            <p><strong>Тип:</strong> {file.type}</p>
            {file.type === 'file' && (
                <>
                    <h3>Содержимое:</h3>
                    <pre>{content ?? 'Невозможно отобразить содержимое файла'}</pre>
                </>
            )}
            <button onClick={onClose}>Закрыть</button>
        </Modal>
    );
};

export default FileModal;
