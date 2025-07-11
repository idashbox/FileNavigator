package com.filesystem.server.controller;

import com.filesystem.server.model.FileInfo;
import com.filesystem.server.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.AccessDeniedException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping
    public List<FileInfo> listFiles(
            @RequestParam(required = false) String path,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer limit) throws IOException {
        return fileService.listFiles(path != null ? path : "", offset, limit);
    }

    @GetMapping("/content")
    public String getFileContent(@RequestParam String path) {
        logger.info("Received file path: '{}'", path);
        Path filePath;
        try {
            filePath = fileService.resolveFilePath(path);
            if (!Files.exists(filePath)) {
                throw new IOException("File not found: " + path);
            }
            if (Files.isDirectory(filePath)) {
                throw new IOException("Path points to a directory, not a file: " + path);
            }
            if (!fileService.isAllowedExtension(filePath)) {
                throw new IOException("Unsupported file type for preview: " + path);
            }
            if (!Files.isReadable(filePath)) {
                throw new AccessDeniedException("Access denied: Cannot read file " + path);
            }
            return new String(Files.readAllBytes(filePath));
        } catch (AccessDeniedException e) {
            logger.error("Access denied for file '{}': {}", path, e.getMessage());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage(), e);
        } catch (IOException e) {
            logger.error("Error reading file '{}': {}", path, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
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
        } catch (FileAlreadyExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
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
        } catch (FileAlreadyExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
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
        } catch (FileAlreadyExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
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
        } catch (FileAlreadyExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
        } catch (IOException e) {
            logger.error("Error uploading file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to upload file: " + e.getMessage(), e);
        }
    }

    @PostMapping("/force")
    public ResponseEntity<Void> forceAction(
            @RequestParam String action,
            @RequestParam(required = false) String sourcePath,
            @RequestParam(required = false) String targetPath,
            @RequestParam(required = false) String newName,
            @RequestParam(required = false) MultipartFile file) throws IOException {
        logger.info("Forcing action '{}' from '{}' to '{}'", action, sourcePath, targetPath);
        try {
            fileService.forceAction(action, sourcePath, targetPath, newName, file);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            logger.error("Error performing forced action '{}': {}", action, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to perform forced action: " + e.getMessage(), e);
        }
    }

    @PutMapping("/rename/force")
    public ResponseEntity<Void> forceRename(@RequestParam String oldPath, @RequestParam String newName) throws IOException {
        try {
            fileService.rename(oldPath, newName, true);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/copy/force")
    public ResponseEntity<Void> forceCopy(@RequestParam String sourcePath, @RequestParam String targetPath) throws IOException {
        try {
            fileService.copy(sourcePath, targetPath, true);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/move/force")
    public ResponseEntity<Void> forceMove(@RequestParam String sourcePath, @RequestParam String targetPath) throws IOException {
        try {
            fileService.move(sourcePath, targetPath, true);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/upload/force")
    public ResponseEntity<Void> forceUpload(@RequestParam("file") MultipartFile file,
                                            @RequestParam(required = false) String path) throws IOException {
        try {
            fileService.saveFile(file, path, true);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }
}