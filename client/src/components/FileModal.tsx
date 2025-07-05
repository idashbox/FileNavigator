import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { FileItem, deleteFile, renameFile, copyFile, moveFile } from '../api/fileApi';
import { getFileContent } from '../api/fileApi';
import { formatDate } from '../utils/formatDate';
import { formatSize } from '../utils/formatSize';
import { mapApiErrorToRussian, translateError } from '../utils/errorTranslations';

interface Props {
    file: FileItem | null;
    onClose: () => void;
    path: string;
    onActionSuccess: () => void;
}

const FileModal: React.FC<Props> = ({ file, onClose, path, onActionSuccess }) => {
    const [content, setContent] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [targetPath, setTargetPath] = useState('');
    const [actionType, setActionType] = useState<'copy' | 'move' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (file && file.type === 'file') {
            const filePath = path ? `${path}/${file.name}` : file.name;
            getFileContent(filePath)
                .then(setContent)
                .catch(() => setContent('Ошибка чтения'));
            setNewName(file.name);
        }
    }, [file, path]);

    const handleDelete = async () => {
        if (!file) return;
        try {
            setError(null);
            setSuccess(null);
            const filePath = path ? `${path}/${file.name}` : file.name;
            await deleteFile(filePath);
            setSuccess('Файл успешно удалён');
            onActionSuccess();
            setTimeout(onClose, 1000);
        } catch (err) {
            setError(mapApiErrorToRussian(err instanceof Error ? err.message : 'Ошибка удаления'));
        }
    };

    const handleRename = async () => {
        if (!file || !newName) return;
        try {
            setError(null);
            setSuccess(null);
            const oldPath = path ? `${path}/${file.name}` : file.name;
            await renameFile(oldPath, newName);
            setSuccess('Файл успешно переименован');
            setNewName('');
            onActionSuccess();
            setTimeout(onClose, 1000);
        } catch (err) {
            setError(mapApiErrorToRussian(err instanceof Error ? err.message : 'Ошибка переименования'));
        }
    };

    const handleCopyMove = async () => {
        if (!file || !targetPath || !actionType) return;
        try {
            setError(null);
            setSuccess(null);
            const sourcePath = path ? `${path}/${file.name}` : file.name;
            const action = actionType === 'copy' ? copyFile : moveFile;
            await action(sourcePath, targetPath);
            setSuccess(`Файл успешно ${actionType === 'copy' ? 'скопирован' : 'перемещён'} в ${targetPath}`);
            setTargetPath('');
            setActionType(null);
            onActionSuccess();
            if (actionType === 'move') {
                setTimeout(onClose, 1000);
            }
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

            <div className="file-actions">
                <h3>Переименовать</h3>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Новое имя"
                />
                <button onClick={handleRename} disabled={!newName}>
                    Переименовать
                </button>

                <h3>Копировать/Переместить</h3>
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

                <h3>Удалить</h3>
                <button onClick={handleDelete}>
                    Удалить
                </button>

                <button onClick={onClose}>Закрыть</button>
            </div>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
        </Modal>
    );
};

export default FileModal;