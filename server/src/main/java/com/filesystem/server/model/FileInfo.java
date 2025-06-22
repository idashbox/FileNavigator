package com.filesystem.server.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FileInfo {
    private String name;
    private String type;
    private long size;
    private String created;
    private String modified;
}
