package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.ChatMessageRequest;
import ai.jamerly.tiein.entity.ChatSession;
import ai.jamerly.tiein.entity.ChatHistory;
import ai.jamerly.tiein.service.AIRequest;
import ai.jamerly.tiein.service.ChatSessionService;
import ai.jamerly.tiein.service.ChatHistoryService;
import ai.jamerly.tiein.service.OpenAIRequestAssembler;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.Optional;

@RestController
@RequestMapping("/chat")
public class OldChatController {

    private static final Logger logger = LoggerFactory.getLogger(OldChatController.class);

    @Autowired
    private OpenAIRequestAssembler openAIRequestAssembler;

    @Autowired
    private ChatSessionService chatSessionService;

    @Autowired
    private ChatHistoryService chatHistoryService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping(value = "/openai")
    public Flux<ServerSentEvent<String>> chatWithOpenAI(@RequestParam("message") String message, @RequestParam(value = "groupId", required = false) String groupId) {
        AIRequest aiRequest = new AIRequest();
        aiRequest.setPrompt(message);
        aiRequest.setGroupId(groupId);

        return openAIRequestAssembler.invoke(aiRequest)
                .map(content -> ServerSentEvent.<String>builder()
                        .data(content)
                        .build())
                .onErrorResume(throwable -> {
                    logger.error("Error during AI service invocation: {}", throwable.getMessage(), throwable);
                    String errorJson;
                    try {
                        // Create an ApiResponse for the error
                        ApiResponse<Void> errorResponse = ApiResponse.error(500, "AI service error: " + throwable.getMessage());
                        errorJson = objectMapper.writeValueAsString(errorResponse);
                    } catch (JsonProcessingException e) {
                        logger.error("Failed to serialize error response to JSON: {}", e.getMessage());
                        errorJson = "{\"code\":500,\"message\":\"Internal server error: Failed to serialize error message.\",\"success\":false}";
                    }
                    // Emit a single ServerSentEvent with the error JSON and then complete the stream
                    return Flux.just(ServerSentEvent.<String>builder()
                            .data(errorJson)
                            .event("error") // Custom event type for frontend to distinguish
                            .build());
                });
    }

}