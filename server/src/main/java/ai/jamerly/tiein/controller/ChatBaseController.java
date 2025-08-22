package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.InitResult;
import ai.jamerly.tiein.repository.UserRepository;
import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.ChatInitResponse;
import ai.jamerly.tiein.dto.ChatMessageRequest;
import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.service.MCPChatBaseService;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@RestController
@RequestMapping("/chatbases")
public class ChatBaseController {
    @Autowired
    MCPChatBaseService mcpChatBaseService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    private WebClient.Builder webClientBuilder;
    @GetMapping("/init")
    public Mono<ResponseEntity<ApiResponse<ChatInitResponse>>> getChatBaseWelcomeMessage(
            @RequestHeader("X-App-Id") String appId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader("X-Accept-Language") String language) {

        MCPChatBase mcpChatBase = mcpChatBaseService.getChatBaseByAppId(appId);
        if (mcpChatBase == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found.")));
        }

        final String finalSessionId = (sessionId == null || sessionId.isEmpty()) ? UUID.randomUUID().toString() : sessionId;
        String userProfile = null;
        if (mcpChatBase.getRequireAuth()) {
            if (mcpChatBase.getAuthUrl() == null || mcpChatBase.getAuthUrl().isEmpty()) {
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(500, "Auth URL not configured.")));
            }
            if (authorizationHeader == null || authorizationHeader.isEmpty()) {
                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Authorization header is missing.")));
            }
            try {
                userProfile = webClientBuilder.build().get()
                        .uri(mcpChatBase.getAuthUrl())
                        .header("Authorization", authorizationHeader)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
            }catch (Exception e){
                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Authorization failed")));
            }
        }

        InitResult initResult = mcpChatBaseService.getWelcomeMessage(appId, language, userProfile);
        ChatInitResponse chatInitResponse = new ChatInitResponse();
        chatInitResponse.setSessionId(finalSessionId);
        chatInitResponse.setMessage(initResult.getMessage());
        return Mono.just(ResponseEntity.ok(ApiResponse.success(chatInitResponse)));
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> processChatMessage(@RequestHeader("X-App-Id") String appId,
                                           @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                           @RequestBody ChatMessageRequest request) {
        MCPChatBase mcpChatBase = mcpChatBaseService.getChatBaseByAppId(appId);
        if (null == mcpChatBase) {
            return Flux.just("Error: ChatBase not found.");
        }
        String userProfileJson = null;
        if (mcpChatBase.getRequireAuth()) {
            if (mcpChatBase.getAuthUrl() == null || mcpChatBase.getAuthUrl().isEmpty()) {
                return Flux.just("Error: Auth URL not configured.");
            }
            if (authorizationHeader == null || authorizationHeader.isEmpty()) {
                return Flux.just("Error: Authorization header is missing.");
            }

            try {
                userProfileJson = webClientBuilder.build().get()
                        .uri(mcpChatBase.getAuthUrl())
                        .header("Authorization", authorizationHeader)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block(); // Block for simplicity, consider reactive approach for production
            } catch (Exception e) {
                return Flux.just("Error: Authentication failed.");
            }
        }

        // For now, assuming userId is 1L (hardcoded for testing)
        // We can get the user id from the user profile returned by the authUrl
        Long userId = 1L; 

        return mcpChatBaseService.processChatMessage(mcpChatBase.getId(), userId, request.getMessage(), userProfileJson);
    }

}
