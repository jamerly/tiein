package ai.jamerly.tiein.dto;

import ai.jamerly.tiein.entity.MCPTool.ToolType;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class ToolDto {
    private Long id;
    private String name;
    private ToolType type;
    private Long groupId;
    private String httpMethod;
    private String httpUrl;
    private String httpHeaders;
    private String httpBody;
    private String groovyScript;
    private String description;
    private String inputSchemaJson;
    private String outputSchemaJson;
    private Boolean isProxy;
    private Long workerId; // New field

    private JsonNode inputSchema;
    private JsonNode outputSchema;

    // Constructors (if needed, Lombok @Data should handle)
    // Getters and Setters (if needed, Lombok @Data should handle)
}