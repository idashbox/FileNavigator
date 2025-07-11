package com.filesystem.server.service;

import com.filesystem.server.model.FileInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class FileService {
    private final Path root;

    @Value("${filesystem.allowed-extensions}")
    private String[] allowedExtensions;

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

    public boolean isAllowedExtension(Path filePath) {
        String fileName = filePath.getFileName().toString();
        String ext = fileName.contains(".") && fileName.lastIndexOf('.') < fileName.length() - 1
                ? fileName.substring(fileName.lastIndexOf('.') + 1)
                : "";
        return Arrays.stream(allowedExtensions)
                .anyMatch(e -> e.equalsIgnoreCase(ext));
    }

    private Path validateAndResolve(String relativePath, boolean mustBeDirectory) throws IOException {
        if (relativePath == null) relativePath = "";
        relativePath = relativePath.trim().replaceFirst("^[\\\\/]+", "");
        if (relativePath.contains("..")) {
            throw new IllegalArgumentException("Parent traversal ('..') is not allowed");
        }
        Path resolved = root.resolve(relativePath).normalize();
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

    public List<FileInfo> listFiles(String relativePath, Integer offset, Integer limit) throws IOException {
        Path dir = validateAndResolve(relativePath, true);
        int effectiveLimit = limit != null && limit > 0 ? limit : 100;
        try (Stream<Path> stream = Files.list(dir)
                .skip(offset != null && offset >= 0 ? offset : 0)
                .limit(effectiveLimit)) {
            return stream.map(this::toFileInfo).collect(Collectors.toList());
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
        if (Files.isDirectory(path)) {
            try (Stream<Path> walk = Files.walk(path)) {
                walk.sorted((p1, p2) -> -p1.compareTo(p2))
                        .forEach(file -> {
                            try {
                                Files.deleteIfExists(file);
                            } catch (IOException e) {
                                throw new RuntimeException("Failed to delete: " + file, e);
                            }
                        });
            }
        } else {
            Files.deleteIfExists(path);
        }
    }

    public void rename(String oldPath, String newName) throws IOException {
        rename(oldPath, newName, false);
    }

    public void copy(String sourcePath, String targetPath) throws IOException {
        copy(sourcePath, targetPath, false);
    }

    public void move(String sourcePath, String targetPath) throws IOException {
        move(sourcePath, targetPath, false);
    }

    public void saveFile(MultipartFile file, String relativePath) throws IOException {
        saveFile(file, relativePath, false);
    }

    public void rename(String oldPath, String newName, boolean force) throws IOException {
        Path source = validateAndResolve(oldPath, false);
        String sourceFileName = source.getFileName().toString();
        String extension = sourceFileName.contains(".") ? sourceFileName.substring(sourceFileName.lastIndexOf(".")) : "";
        String targetName = newName.contains(".") ? newName : newName + extension;
        Path target = source.resolveSibling(targetName);

        if (Files.exists(target)) {
            if (force) {
                Files.delete(target);
            } else {
                throw new FileAlreadyExistsException("File already exists: " + target);
            }
        }
        Files.move(source, target);
    }

    public void copy(String sourcePath, String targetPath, boolean force) throws IOException {
        Path source = validateAndResolve(sourcePath, false);
        Path targetDir = validateAndResolve(targetPath, true);
        Path target = targetDir.resolve(source.getFileName());

        if (Files.exists(target)) {
            if (force) {
                if (Files.isDirectory(target)) {
                    delete(target.toString());
                } else {
                    Files.delete(target);
                }
            } else {
                throw new FileAlreadyExistsException("File already exists: " + target);
            }
        }

        if (Files.isDirectory(source)) {
            copyDirectory(source, target);
        } else {
            Files.copy(source, target);
        }
    }

    public void move(String sourcePath, String targetPath, boolean force) throws IOException {
        Path source = validateAndResolve(sourcePath, false);
        Path targetDir = validateAndResolve(targetPath, true);
        Path target = targetDir.resolve(source.getFileName());

        if (Files.exists(target)) {
            if (force) {
                if (Files.isDirectory(target)) {
                    delete(target.toString());
                } else {
                    Files.delete(target);
                }
            } else {
                throw new FileAlreadyExistsException("File already exists: " + target);
            }
        }
        Files.move(source, target);
    }

    public void saveFile(MultipartFile file, String relativePath, boolean force) throws IOException {
        Path dir = validateAndResolve(relativePath != null ? relativePath : "", true);
        Path target = dir.resolve(file.getOriginalFilename());

        if (Files.exists(target)) {
            if (force) {
                Files.delete(target);
            } else {
                throw new FileAlreadyExistsException("File already exists: " + target);
            }
        }

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target);
        }
    }

    public void forceAction(String action, String sourcePath, String targetPath, String newName, MultipartFile file) throws IOException {
        switch (action) {
            case "rename":
                if (sourcePath == null || newName == null) {
                    throw new IllegalArgumentException("sourcePath and newName are required for rename");
                }
                rename(sourcePath, newName, true);
                break;
            case "copy":
                if (sourcePath == null || targetPath == null) {
                    throw new IllegalArgumentException("sourcePath and targetPath are required for copy");
                }
                copy(sourcePath, targetPath, true);
                break;
            case "move":
                if (sourcePath == null || targetPath == null) {
                    throw new IllegalArgumentException("sourcePath and targetPath are required for move");
                }
                move(sourcePath, targetPath, true);
                break;
            case "upload":
                if (file == null || targetPath == null) {
                    throw new IllegalArgumentException("file and targetPath are required for upload");
                }
                saveFile(file, targetPath, true);
                break;
            default:
                throw new IllegalArgumentException("Invalid action: " + action);
        }
    }

    private void copyDirectory(Path source, Path target) throws IOException {
        Files.walk(source).forEach(s -> {
            try {
                Path t = target.resolve(source.relativize(s));
                if (Files.isDirectory(s)) {
                    Files.createDirectories(t);
                } else {
                    if (Files.exists(t)) {
                        throw new FileAlreadyExistsException("File already exists in directory copy: " + t);
                    }
                    Files.copy(s, t);
                }
            } catch (IOException e) {
                throw new UncheckedIOException("Failed to copy directory: " + source, e);
            }
        });
    }
}