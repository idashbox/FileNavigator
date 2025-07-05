package com.filesystem.server.service;

import com.filesystem.server.model.FileInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.web.multipart.MultipartFile;

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

    public void delete(String relativePath) throws IOException {
        Path path = validateAndResolve(relativePath, false);
        Files.deleteIfExists(path);
    }

    public void rename(String oldPath, String newName) throws IOException {
        Path source = validateAndResolve(oldPath, false);
        String sourceFileName = source.getFileName().toString();
        String extension = sourceFileName.contains(".") ? sourceFileName.substring(sourceFileName.lastIndexOf(".")) : "";
        String targetName = newName.contains(".") ? newName : newName + extension;
        Path target = source.resolveSibling(targetName);
        Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
    }

    public void copy(String sourcePath, String targetPath) throws IOException {
        Path source = validateAndResolve(sourcePath, false);
        Path targetDir = validateAndResolve(targetPath, true);
        Path target = targetDir.resolve(source.getFileName());
        Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
    }

    public void move(String sourcePath, String targetPath) throws IOException {
        Path source = validateAndResolve(sourcePath, false);
        Path targetDir = validateAndResolve(targetPath, true);
        Path target = targetDir.resolve(source.getFileName());
        Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
    }

    public void saveFile(MultipartFile file, String relativePath) throws IOException {
        Path dir = validateAndResolve(relativePath != null ? relativePath : "", true);
        Path target = dir.resolve(file.getOriginalFilename());
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}