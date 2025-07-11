import React from 'react';
import { translateError } from '../utils/errorTranslations';
import './ErrorView.css';

interface ErrorViewProps {
    message: string;
    onBack: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ message, onBack }) => {
    const translatedMessage = translateError(message);

    return (
        <div className="error-view">
            <h2>Ошибка</h2>
            <p><strong>Сообщение:</strong> {translatedMessage}</p>
            <button onClick={onBack}>Назад</button>
        </div>
    );
};

export default ErrorView;