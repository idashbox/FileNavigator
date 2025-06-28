package com.filesystem.server;

import com.filesystem.server.model.FileInfo;
import com.filesystem.server.service.FileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;


@SpringBootTest
class FileServiceTests {

    @Autowired
    FileService fileService;

    @Test
    void listFiles_root_shouldReturnList() throws Exception {
        List<FileInfo> files = fileService.listFiles("");
        assertNotNull(files);
    }

    @Test
    void listFiles_invalidPath_shouldThrow() {
        Exception exception = assertThrows(Exception.class, () -> {
            fileService.listFiles("invalid/path");
        });

        assertTrue(exception instanceof IOException ||
                        exception instanceof IllegalArgumentException,
                "Expected IOException or IllegalArgumentException");
    }

    @Test
    void listFiles_pathWithParentTraversal_shouldThrowIllegalArgumentException() {
        // случай с ".."
        assertThrows(IllegalArgumentException.class, () -> {
            fileService.listFiles("../invalid");
        });
    }

    @Test
    void listFiles_outsideRoot_shouldThrowSecurityException() {
        String outsidePath = fileService.resolveFilePath("").getParent().resolve("outside").toString();
        assertThrows(SecurityException.class, () -> {
            fileService.listFiles(outsidePath);
        });
    }
}

