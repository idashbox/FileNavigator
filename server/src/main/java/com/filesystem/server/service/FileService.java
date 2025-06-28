package com.filesystem.server.service;

import com.filesystem.server.model.FileInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class FileService {
    private final Path root;

    public FileService(@Value("${filesystem.root-path}") String rootPath) {
        this.root = Paths.get(rootPath).toAbsolutePath().normalize();
        try {
            if (!Files.exists(this.root)) {
                Files.createDirectories(this.root);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize root directory: " + rootPath, e);
        }
    }

    public List<FileInfo> listFiles(String relativePath) throws IOException {
        relativePath = (relativePath == null) ? "" : relativePath.trim();

        // проверяем наличие ".." в пути
        if (relativePath.contains("..")) {
            throw new IllegalArgumentException("Путь содержит попытку перехода в родительскую директорию '..'");
        }

        Path requestedPath = root.resolve(relativePath).normalize();

        //  проверяем, что путь находится в пределах корневой директории
        if (!requestedPath.startsWith(root)) {
            throw new SecurityException("Попытка доступа к пути за пределами корневой директории");
        }

        if (!Files.exists(requestedPath)) {
            throw new IOException("Путь не существует: " + requestedPath);
        }

        if (!Files.isDirectory(requestedPath)) {
            throw new IOException("Указанный путь не является директорией: " + requestedPath);
        }

        try (Stream<Path> paths = Files.list(requestedPath)) {
            return paths.map(this::toFileInfo).collect(Collectors.toList());
        }
    }

    private FileInfo toFileInfo(Path path) {
        try {
            BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
            return new FileInfo(
                    path.getFileName().toString(),
                    Files.isDirectory(path) ? "directory" : "file",
                    attrs.size(),
                    attrs.creationTime().toString(),
                    attrs.lastModifiedTime().toString()
            );
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read file attributes: " + path, e);
        }
    }

    public Path resolveFilePath(String relativePath) {
        if (relativePath == null || relativePath.trim().isEmpty()) {
            return root;
        }
        // Удаляем начальные слэши (/, \) для корректной обработки относительных путей
        relativePath = relativePath.trim().replaceFirst("^[\\\\/]+", "");

        if (relativePath.contains("..")) {
            throw new IllegalArgumentException("Нельзя подниматься выше root");
        }

        Path resolved = root.resolve(relativePath).normalize();

        if (!resolved.startsWith(root)) {
            throw new SecurityException("Доступ запрещён");
        }

        return resolved;
    }
}