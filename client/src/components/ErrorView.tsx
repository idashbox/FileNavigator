import React from 'react';
import './ErrorView.css';

interface ErrorViewProps {
    message: string;
    onBack: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ message, onBack }) => {
    return (
        <div className="error-view">
            <h2>Произошла ошибка</h2>
            <p>{message}</p>
            <button onClick={onBack}>Вернуться назад</button>
        </div>
    );
};

export default ErrorView;