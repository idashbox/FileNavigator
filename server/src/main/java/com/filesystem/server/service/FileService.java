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
        System.out.println("Processing path: '" + relativePath + "'");

        relativePath = (relativePath == null) ? "" : relativePath.trim();

        if (relativePath.contains("..")) {
            throw new IllegalArgumentException("Path contains invalid '..' sequence");
        }

        Path requestedPath = root.resolve(relativePath).normalize();
        System.out.println("Resolved path: " + requestedPath);

        if (!requestedPath.startsWith(root)) {
            throw new SecurityException("Access denied: path outside root directory");
        }

        if (!Files.exists(requestedPath)) {
            throw new IOException("Path does not exist: " + requestedPath);
        }

        if (!Files.isDirectory(requestedPath)) {
            throw new IOException("Path is not a directory: " + requestedPath);
        }

        try (Stream<Path> paths = Files.list(requestedPath)) {
            return paths.map(p -> {
                try {
                    BasicFileAttributes attrs = Files.readAttributes(p, BasicFileAttributes.class);
                    return new FileInfo(
                            p.getFileName().toString(),
                            Files.isDirectory(p) ? "directory" : "file",
                            attrs.size(),
                            attrs.creationTime().toString(),
                            attrs.lastModifiedTime().toString()
                    );
                } catch (IOException e) {
                    throw new UncheckedIOException("Failed to read file attributes: " + p, e);
                }
            }).collect(Collectors.toList());
        }
    }
}