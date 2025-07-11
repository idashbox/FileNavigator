import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { FileItem, deleteFile, renameFile, copyFile, moveFile, forceAction } from '../api/fileApi';
import { getFileContent } from '../api/fileApi';
import { formatDate } from '../utils/formatDate';
import { formatSize } from '../utils/formatSize';
import { translateError } from '../utils/errorTranslations';
import ConfirmModal from './ConfirmModal';

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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const [loadingContent, setLoadingContent] = useState(false);

    const loadFileContent = async () => {
        if (!file || file.type !== 'file') return;

        setLoadingContent(true);
        try {
            const filePath = path ? `${path}/${file.name}` : file.name;
            const content = await getFileContent(filePath);
            setContent(content);
        } catch (err) {
            const errorMessage = translateError(err);
            if (err instanceof Error && err.cause) {
                const status = (err.cause as any).status;
                if (status === 403) {
                    setContent('Доступ запрещён: недостаточно прав для просмотра файла');
                } else if (status === 400 && errorMessage.includes('Unsupported file type')) {
                    setContent('Формат файла не поддерживается для просмотра');
                } else {
                    setContent(`Ошибка: ${errorMessage}`);
                }
            } else {
                setContent(`Ошибка: ${errorMessage}`);
            }
        } finally {
            setLoadingContent(false);
        }
    };

    useEffect(() => {
        loadFileContent();
        if (file) setNewName(file.name);
    }, [file, path]);

    const handleOperation = async (
        action: () => Promise<void>,
        successMessage: string,
        shouldClose: boolean = false
    ) => {
        try {
            setError(null);
            setSuccess(null);
            await action();
            setSuccess(successMessage);
            onActionSuccess();
            if (shouldClose) {
                setTimeout(onClose, 1000);
            }
        } catch (err) {
            if (err instanceof Error && err.cause && (err.cause as any).status === 409) {
                setShowConfirmModal(true);
                setConfirmAction(() => async () => {
                    try {
                        await action();
                        setSuccess(successMessage);
                        onActionSuccess();
                        if (shouldClose) {
                            setTimeout(onClose, 1000);
                        }
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

    const handleDelete = async () => {
        if (!file) return;
        const filePath = path ? `${path}/${file.name}` : file.name;
        await handleOperation(
            () => deleteFile(filePath),
            'Файл успешно удалён',
            true
        );
    };

    const handleRename = async () => {
        if (!file || !newName) return;
        const oldPath = path ? `${path}/${file.name}` : file.name;
        await handleOperation(
            () => renameFile(oldPath, newName),
            'Файл успешно переименован',
            true
        );
    };

    const handleCopyMove = async () => {
        if (!file || !targetPath || !actionType) return;
        const sourcePath = path ? `${path}/${file.name}` : file.name;
        await handleOperation(
            () => (actionType === 'copy' ? copyFile : moveFile)(sourcePath, targetPath),
            `Файл успешно ${actionType === 'copy' ? 'скопирован' : 'перемещён'} в ${targetPath}`,
            actionType === 'move'
        );
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

    if (!file) return null;

    return (
        <>
            <Modal isOpen={!!file} onRequestClose={onClose} contentLabel="File Info">
                <h2>{file.name}</h2>
                <p><strong>Размер:</strong> {formatSize(file.size)}</p>
                <p><strong>Создан:</strong> {file.created ? formatDate(file.created) : '-'}</p>
                <p><strong>Изменён:</strong> {formatDate(file.modified)}</p>
                <p><strong>Тип:</strong> {file.type === 'file' ? 'Файл' : 'Директория'}</p>

                {file.type === 'file' && (
                    <>
                        <h3>Содержимое:</h3>
                        <div className="file-content">
                            {loadingContent ? (
                                <p>Загрузка...</p>
                            ) : (
                                <pre>{content}</pre>
                            )}
                        </div>
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
            <ConfirmModal
                isOpen={showConfirmModal}
                message={`Файл уже существует. Перезаписать?`}
                onConfirm={confirmAction}
                onCancel={handleCancelAction}
            />
        </>
    );
};

export default FileModal;