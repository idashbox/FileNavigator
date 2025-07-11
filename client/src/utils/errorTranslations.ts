export const translateError = (error: unknown): string => {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const errorMap: Record<string, string> = {
        'Directory not found': 'Директория не найдена',
        'File not found': 'Файл не найден',
        'Unsupported file type for preview': 'Формат файла не поддерживается для просмотра',
        'Access denied: Cannot read file': 'Доступ запрещён: недостаточно прав',
        'Access denied: Cannot read directory': 'Доступ запрещён: недостаточно прав',
        'Failed to load file content': 'Ошибка загрузки содержимого файла',
        'File or directory not found': 'Файл или директория не найдены',
        'File deletion error': 'Ошибка удаления файла',
        'File rename error': 'Ошибка переименования файла',
        'File copy error': 'Ошибка копирования файла',
        'File move error': 'Ошибка перемещения файла',
        'File upload error': 'Ошибка загрузки файла',
        'Target directory not found': 'Целевая директория не найдена',
        'Source or target path not found': 'Исходный или целевой путь не найден',
        'Failed to load files': 'Не удалось загрузить файлы',
        'File already exists': 'Файл уже существует',
        'Path does not exist': 'Путь не существует',
        'Attempted access outside root': 'Попытка доступа за пределы корневой директории',
        'Parent traversal (\'..\') is not allowed': 'Навигация на уровень выше (\'..\') запрещена',
        'Expected a directory': 'Ожидалась директория',
        'Invalid action parameters': 'Неверные параметры действия',
        'Invalid action': 'Недопустимое действие',
        'Failed to perform forced action': 'Не удалось выполнить принудительное действие',
        'Client error': 'Ошибка клиента'
    };

    if (errorMessage.includes('Unsupported file type')) {
        return 'Формат файла не поддерживается';
    }
    if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
        return 'Доступ запрещён: недостаточно прав';
    }
    if (errorMessage.includes('Failed to load file content')) {
        return 'Не удалось загрузить содержимое файла';
    }

    for (const [en, ru] of Object.entries(errorMap)) {
        if (errorMessage.includes(en)) {
            return ru;
        }
    }

    return errorMessage;
};