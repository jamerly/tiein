package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.InitResult;
import ai.jamerly.tiein.entity.MCPChatHistory;
import ai.jamerly.tiein.repository.UserRepository;
import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.ChatInitResponse;
import ai.jamerly.tiein.dto.ChatMessageRequest;
import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.service.MCPChatBaseService;
import ai.jamerly.tiein.service.MCPChatHistoryService;
import ai.jamerly.tiein.service.RedisService;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.internal.StringUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

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

    @Autowired
    MCPChatHistoryService mcpChatHistoryService;

    @Autowired
    RedisService redisService;

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
        String welcomeMessage = initResult.getMessage();
        String extractedUserId = initResult.getUserId();
        if( !StringUtil.isBlank(extractedUserId)){
            redisService.set("chat_user_id:" + finalSessionId,
                    initResult.getUserId(),1L,TimeUnit.DAYS
            );
        }

        ChatInitResponse chatInitResponse = new ChatInitResponse();
        chatInitResponse.setSessionId(finalSessionId);
        chatInitResponse.setMessage(welcomeMessage);
        return Mono.just(ResponseEntity.ok(ApiResponse.success(chatInitResponse)));
    }

    @GetMapping( value = "/char/history")
    public Mono<ResponseEntity<ApiResponse<List<MCPChatHistory>>>> queryHistory(
            @RequestHeader("X-App-Id") String appId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ){
        MCPChatBase mcpChatBase = mcpChatBaseService.getChatBaseByAppId(appId);
        if (null == mcpChatBase) {
            return Mono.just(
                    ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error(404, "ChatBase not found.")));
        }
        List<MCPChatHistory> histories = mcpChatHistoryService.queryBySessionId(sessionId);
        return Mono.just(ResponseEntity.ok(ApiResponse.success(histories)));
    }
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> processChatMessage(@RequestHeader("X-App-Id") String appId,
                                           @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
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

        String userId = redisService.get("chat_user_id:" + sessionId);
        if( StringUtil.isBlank(userId)){
            return Flux.just("Error: System error");
        }
        redisService.set("chat_user_id:" + sessionId,
                userId,1L,TimeUnit.DAYS
        );
        return mcpChatBaseService.processChatMessage(
                mcpChatBase.getId(),sessionId, userId, request.getMessage(), userProfileJson);
    }

}
