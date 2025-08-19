package ai.jamerly.tiein.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.util.Map;

@Data
public class CompletionRequestRef {
    private String type; // "resourceTemplate" or "prompt"
    private String uri; // for resourceTemplate
    private String name; // for prompt
}
