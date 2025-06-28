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

@RestController
@RequestMapping("/api/files")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping
    public List<FileInfo> listFiles(@RequestParam(required = false) String path) throws IOException {
        System.out.println("Received path parameter: '" + path + "'");
        return fileService.listFiles(path != null ? path : "");
    }
    @GetMapping("/content")
    public String getFileContent(@RequestParam String path) throws IOException {
        System.out.println("Requested file path: '" + path + "'");
        Path filePath = fileService.resolveFilePath(path);

        System.out.println("Resolved file path: '" + filePath + "'");
        if (!Files.exists(filePath)) {
            throw new IOException("Файл не найден: " + filePath);
        }

        if (Files.isDirectory(filePath)) {
            throw new IOException("Указанный путь является директорией: " + filePath);
        }

        return new String(Files.readAllBytes(filePath));
    }
}