package ai.jamerly.tiein.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class ToolDto {
    private String name;
    private String description;
    private JsonNode inputSchema;
    private JsonNode outputSchema;
}
