package ai.jamerly.tiein.service;

import ai.jamerly.tiein.dto.CompleteRequestParams;
import ai.jamerly.tiein.dto.CompleteResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class CompletionService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public CompleteResult complete(CompleteRequestParams params) {
        CompleteResult result = new CompleteResult();
        try {
            // Mock implementation: just return a hardcoded response or echo arguments
            String content = "This is a mock completion response for ref: " + params.getRef().getType();
            if (params.getRef().getType().equals("resourceTemplate")) {
                content += " with URI: " + params.getRef().getUri();
            } else if (params.getRef().getType().equals("prompt")) {
                content += " with name: " + params.getRef().getName();
            }

            content += ". Arguments: " + objectMapper.writeValueAsString(params.getArgument());

            if (params.getContext() != null && params.getContext().getArguments() != null) {
                content += ". Context Arguments: " + objectMapper.writeValueAsString(params.getContext().getArguments());
            }

            result.setContent(content);
            result.setStructuredContent(null); // No structured content for mock
            result.setError(false);

        } catch (Exception e) {
            result.setError(true);
            result.setErrorMessage("Mock completion failed: " + e.getMessage());
        }
        return result;
    }
}
