package com.filesystem.server.controller;

import com.filesystem.server.model.FileInfo;
import com.filesystem.server.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping
    public List<FileInfo> listFiles(@RequestParam(required = false) String path) throws IOException {
        logger.info("Received path parameter: '{}'", path);
        return fileService.listFiles(path != null ? path : "");
    }

    @GetMapping("/content")
    public String getFileContent(@RequestParam String path) throws IOException {
        logger.info("Received file path: '{}'", path);
        Path filePath = fileService.resolveFilePath(path);

        if (!Files.exists(filePath)) {
            throw new IOException("File not found: " + filePath);
        }
        if (Files.isDirectory(filePath)) {
            throw new IOException("Path points to a directory, not a file: " + filePath);
        }

        String fileName = filePath.getFileName().toString();
        String extension = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf(".") + 1) : "";

        List<String> allowedExtensions = List.of("txt", "md", "json", "log");
        if (!allowedExtensions.contains(extension.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Viewing this file type is not supported: ." + extension);
        }

        return new String(Files.readAllBytes(filePath));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@RequestParam String path) throws IOException {
        logger.info("Deleting path: '{}'", path);
        try {
            fileService.delete(path);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            logger.error("Error deleting file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File or directory not found: " + path, e);
        }
    }

    @PutMapping("/rename")
    public ResponseEntity<Void> rename(@RequestParam String oldPath, @RequestParam String newName) throws IOException {
        logger.info("Renaming from '{}' to '{}'", oldPath, newName);
        try {
            fileService.rename(oldPath, newName);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            logger.error("Error renaming file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File or directory not found: " + oldPath, e);
        }
    }

    @PostMapping("/copy")
    public ResponseEntity<Void> copy(@RequestParam String sourcePath, @RequestParam String targetPath) throws IOException {
        logger.info("Copying from '{}' to '{}'", sourcePath, targetPath);
        try {
            fileService.copy(sourcePath, targetPath);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            logger.error("Error copying file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Source or target path not found", e);
        }
    }

    @PostMapping("/move")
    public ResponseEntity<Void> move(@RequestParam String sourcePath, @RequestParam String targetPath) throws IOException {
        logger.info("Moving from '{}' to '{}'", sourcePath, targetPath);
        try {
            fileService.move(sourcePath, targetPath);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            logger.error("Error moving file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Source or target path not found", e);
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Void> uploadFile(@RequestParam("file") MultipartFile file,
                                           @RequestParam(required = false) String path) throws IOException {
        logger.info("Uploading file '{}' to path '{}'", file.getOriginalFilename(), path);
        try {
            fileService.saveFile(file, path);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            logger.error("Error uploading file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to upload file: " + e.getMessage(), e);
        }
    }
}