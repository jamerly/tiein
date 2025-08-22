package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.ChatInitResponse;
import ai.jamerly.tiein.dto.ChatMessageRequest;
import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.repository.MCPChatBaseRepository;
import ai.jamerly.tiein.service.MCPChatBaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/chatbases")
public class ChatBaseController {
    @Autowired
    MCPChatBaseService mcpChatBaseService;
    @GetMapping("/init")
    public ResponseEntity<ApiResponse<ChatInitResponse>> getChatBaseWelcomeMessage(
            @RequestHeader("X-App-Id") String appId,
            @RequestHeader("X-Accept-Language") String language
            ) {
        String welcomeMessage = mcpChatBaseService.getWelcomeMessage(appId, language);
        if (welcomeMessage.equals("ChatBase not found.")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, welcomeMessage));
        }
        ChatInitResponse  chatInitResponse = new ChatInitResponse();
        //TODO 需要创建一个sessionId
        chatInitResponse.setSessionId(null);
        chatInitResponse.setMessage(welcomeMessage);
        return ResponseEntity.ok(ApiResponse.success(chatInitResponse));
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> processChatMessage( @RequestHeader("X-App-Id") String appId,
                                            @RequestBody ChatMessageRequest request) {
        // For now, assuming userId is 1L (hardcoded for testing)
        MCPChatBase mcpChatBase = mcpChatBaseService.getChatBaseByAppId(appId);
        if ( null == mcpChatBase ) {
            return Flux.just("Error: ChatBase not found.");
        }
        return mcpChatBaseService.processChatMessage(mcpChatBase.getId(), 1L, request.getMessage());
    }

}
