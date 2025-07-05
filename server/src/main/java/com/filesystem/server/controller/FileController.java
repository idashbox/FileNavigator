package com.filesystem.server.controller;

import com.filesystem.server.model.FileInfo;
import com.filesystem.server.service.FileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

        logger.debug("Resolved file path: '{}'", filePath);
        if (!Files.exists(filePath)) {
            throw new IOException("File not found: " + filePath);
        }

        if (Files.isDirectory(filePath)) {
            throw new IOException("Path points to a directory, not a file: " + filePath);
        }

        return new String(Files.readAllBytes(filePath));
    }
}