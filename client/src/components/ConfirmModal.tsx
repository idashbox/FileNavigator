import React from 'react';
import Modal from 'react-modal';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onCancel}
            contentLabel="Confirm Overwrite"
            className="confirm-modal"
            overlayClassName="confirm-modal-overlay"
        >
            <h2>Подтверждение перезаписи</h2>
            <p>{message}</p>
            <div className="confirm-modal-buttons">
                <button onClick={onConfirm}>Перезаписать</button>
                <button onClick={onCancel}>Отмена</button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;