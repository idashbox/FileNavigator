package com.filesystem.server;

import com.filesystem.server.model.FileInfo;
import com.filesystem.server.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@TestPropertySource(properties = {
        "filesystem.root-path=${java.io.tmpdir}/test-root"
})
class FileServiceTests {

    @Autowired
    private FileService fileService;

    @BeforeEach
    void setUp() throws IOException {
        Path root = fileService.resolveFilePath("");
        if (Files.exists(root)) {
            Files.walk(root)
                    .sorted((a, b) -> -a.compareTo(b))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException e) {
                            // игнорируем
                        }
                    });
        }
        Files.createDirectories(root);

        Files.createFile(root.resolve("test.txt"));
        Files.createDirectories(root.resolve("subdir"));
        Files.createFile(root.resolve("subdir/file.txt"));
    }

    @Test
    void listFiles_withOffsetAndLimit_shouldReturnPaginatedList() throws IOException {
        List<FileInfo> files = fileService.listFiles("", 1, 1);
        assertNotNull(files, "File list should not be null");
        assertTrue(files.size() <= 1, "List size should respect limit=1");
    }

    @Test
    void listFiles_invalidPath_shouldThrowIOException() {
        Exception exception = assertThrows(IOException.class, () -> {
            fileService.listFiles("invalid/path", 0, null);
        });
        assertTrue(exception.getMessage().contains("Path does not exist"),
                "Expected IOException with 'Path does not exist' message");
    }

    @Test
    void listFiles_pathWithParentTraversal_shouldThrowIllegalArgumentException() {
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            fileService.listFiles("../invalid", 0, null);
        });
        assertEquals("Parent traversal ('..') is not allowed", exception.getMessage(),
                "Expected IllegalArgumentException with specific message");
    }

    @Test
    void listFiles_outsideRoot_shouldThrowSecurityException() throws IOException {
        String outsidePath = fileService.resolveFilePath("").getParent().resolve("outside").toString();
        Exception exception = assertThrows(SecurityException.class, () -> {
            fileService.listFiles(outsidePath, 0, null);
        });
        assertEquals("Attempted access outside root", exception.getMessage(),
                "Expected SecurityException with specific message");
    }

    @Test
    void isAllowedExtension_validExtension_shouldReturnTrue() throws IOException {
        assertTrue(fileService.isAllowedExtension(fileService.resolveFilePath("test.txt")), "txt should be allowed");
    }

    @Test
    void isAllowedExtension_invalidExtension_shouldReturnFalse() throws IOException {
        Path pngFile = fileService.resolveFilePath("").resolve("test.png");
        Files.createFile(pngFile);
        assertFalse(fileService.isAllowedExtension(pngFile), "png should not be allowed");
    }

    @Test
    void rename_fileExists_shouldThrowFileAlreadyExistsException() throws IOException {
        Path root = fileService.resolveFilePath("");
        Files.createFile(root.resolve("new.txt"));
        Exception exception = assertThrows(FileAlreadyExistsException.class, () -> {
            fileService.rename("test.txt", "new.txt", false);
        });
        assertTrue(exception.getMessage().contains("File already exists"),
                "Expected FileAlreadyExistsException");
    }

    @Test
    void copy_fileExists_shouldThrowFileAlreadyExistsException() throws IOException {
        Path root = fileService.resolveFilePath("");
        Path targetDir = root.resolve("target");
        Files.createDirectories(targetDir);
        Files.createFile(targetDir.resolve("test.txt"));
        Exception exception = assertThrows(FileAlreadyExistsException.class, () -> {
            fileService.copy("test.txt", "target", false);
        });
        assertTrue(exception.getMessage().contains("File already exists"),
                "Expected FileAlreadyExistsException");
    }

    @Test
    void move_fileExists_shouldThrowFileAlreadyExistsException() throws IOException {
        Path root = fileService.resolveFilePath("");
        Path targetDir = root.resolve("target");
        Files.createDirectories(targetDir);
        Files.createFile(targetDir.resolve("test.txt"));
        Exception exception = assertThrows(FileAlreadyExistsException.class, () -> {
            fileService.move("test.txt", "target", false);
        });
        assertTrue(exception.getMessage().contains("File already exists"),
                "Expected FileAlreadyExistsException");
    }

    @Test
    void saveFile_fileExists_shouldThrowFileAlreadyExistsException() throws IOException {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.getOriginalFilename()).thenReturn("test.txt");
        when(mockFile.getInputStream()).thenReturn(Files.newInputStream(fileService.resolveFilePath("test.txt")));
        Exception exception = assertThrows(FileAlreadyExistsException.class, () -> {
            fileService.saveFile(mockFile, "", false);
        });
        assertTrue(exception.getMessage().contains("File already exists"),
                "Expected FileAlreadyExistsException");
    }

    @Test
    void forceAction_rename_shouldRenameFile() throws IOException {
        Path root = fileService.resolveFilePath("");

        assertTrue(Files.exists(root.resolve("test.txt")), "Original file should exist");

        fileService.forceAction("rename", "test.txt", null, "newname.txt", null);

        assertTrue(Files.exists(root.resolve("newname.txt")), "File should be renamed");
        assertFalse(Files.exists(root.resolve("test.txt")), "Original file should not exist");
    }

    @Test
    void listFiles_largeDirectory_shouldRespectDefaultLimit() throws IOException {
        Path root = fileService.resolveFilePath("");
        for (int i = 0; i < 150; i++) {
            Files.createFile(root.resolve("file" + i + ".txt"));
        }
        List<FileInfo> files = fileService.listFiles("", 0, null);
        assertEquals(100, files.size(), "Should respect default limit of 100");
    }
}