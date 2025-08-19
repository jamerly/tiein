package ai.jamerly.tiein.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class PromptDto {
    private String name;
    private String description;
    private String content;
    private JsonNode inputSchema;
    private JsonNode outputSchema;
}
