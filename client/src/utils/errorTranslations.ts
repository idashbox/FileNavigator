export const mapApiErrorToRussian = (error: string): string => {
    const errorMap: Record<string, string> = {
        'Directory not found': 'Директория не найдена',
        'File not found': 'Файл не найден',
        'Unsupported file type for preview': 'Тип файла не поддерживается для просмотра',
        'File content loading error': 'Ошибка загрузки содержимого файла',
        'File or directory not found': 'Файл или директория не найдены',
        'File deletion error': 'Ошибка удаления файла',
        'File rename error': 'Ошибка переименования файла',
        'File copy error': 'Ошибка копирования файла',
        'File move error': 'Ошибка перемещения файла',
        'Target directory not found': 'Целевая директория не найдена',
        'File upload error': 'Ошибка загрузки файла',
        'Client error': 'Неизвестная ошибка клиента',
        'Source or target path not found': 'Исходный или целевой путь не найден',
        'Failed to load files': 'Не удалось загрузить файлы'
    };

    // проверяем частичные совпадения
    for (const [en, ru] of Object.entries(errorMap)) {
        if (error.includes(en)) {
            return error.replace(en, ru);
        }
    }

    return error;
};

export const translateError = (error: unknown): string => {
    if (error instanceof Error) {
        return mapApiErrorToRussian(error.message);
    }
    return mapApiErrorToRussian(String(error));
};