package ai.jamerly.tiein.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class CompleteResult {
    private String content;
    private JsonNode structuredContent;
    private boolean isError;
    private String errorMessage;
}
