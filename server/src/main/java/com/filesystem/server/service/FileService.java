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

    private Path validateAndResolve(String relativePath, boolean mustBeDirectory) throws IOException {
        if (relativePath == null) relativePath = "";
        // Удаляем начальные слэши (/, \) для корректной обработки относительных путей
        relativePath = relativePath.trim().replaceFirst("^[\\\\/]+", "");

        // проверяем наличие ".." в пути
        if (relativePath.contains("..")) {
            throw new IllegalArgumentException("Parent traversal ('..') is not allowed");
        }

        Path resolved = root.resolve(relativePath).normalize();

        //  проверяем, что путь находится в пределах корневой директории
        if (!resolved.startsWith(root)) {
            throw new SecurityException("Attempted access outside root");
        }

        if (!Files.exists(resolved)) {
            throw new IOException("Path does not exist: " + resolved);
        }

        if (mustBeDirectory && !Files.isDirectory(resolved)) {
            throw new IOException("Expected a directory: " + resolved);
        }

        return resolved;
    }

    public List<FileInfo> listFiles(String relativePath) throws IOException {
        Path requestedPath = validateAndResolve(relativePath, true);

        try (Stream<Path> paths = Files.list(requestedPath)) {
            return paths.map(this::toFileInfo).collect(Collectors.toList());
        }
    }

    public Path resolveFilePath(String relativePath) throws IOException {
        return validateAndResolve(relativePath, false);
    }

    private FileInfo toFileInfo(Path path) {
        try {
            BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
            boolean isDirectory = Files.isDirectory(path);
            long size = isDirectory ? calculateDirectorySize(path) : attrs.size();

            return new FileInfo(
                    path.getFileName().toString(),
                    isDirectory ? "directory" : "file",
                    size,
                    attrs.creationTime().toString(),
                    attrs.lastModifiedTime().toString()
            );
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read file attributes: " + path, e);
        }
    }

    private long calculateDirectorySize(Path directory) {
        try (Stream<Path> files = Files.walk(directory)) {
            return files
                    .filter(Files::isRegularFile)
                    .mapToLong(p -> {
                        try {
                            return Files.size(p);
                        } catch (IOException e) {
                            return 0L;
                        }
                    })
                    .sum();
        } catch (IOException e) {
            return 0L;
        }
    }

}