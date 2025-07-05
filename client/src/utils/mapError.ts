export const mapErrorMessage = (status?: number, fallback = 'Неизвестная ошибка') => {
    switch (status) {
        case 400:
            return 'Некорректный запрос';
        case 401:
            return 'Неавторизован';
        case 403:
            return 'Доступ запрещён';
        case 404:
            return 'Файл или директория не найдены';
        case 500:
            return 'Внутренняя ошибка сервера';
        default:
            return fallback;
    }
};