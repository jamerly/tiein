package ai.jamerly.tiein.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.util.Map;

@Data
public class CompleteRequestParams {
    private CompletionRequestRef ref;
    private Map<String, String> argument;
    private CompletionContext context;
}
