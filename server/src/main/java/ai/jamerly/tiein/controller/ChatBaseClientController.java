package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.InitResult;
import ai.jamerly.tiein.entity.ChatHistory;
import ai.jamerly.tiein.entity.ChatSession;
import ai.jamerly.tiein.repository.UserRepository;
import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.ChatInitResponse;
import ai.jamerly.tiein.dto.ChatMessageRequest;
import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.service.*;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.internal.StringUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/chatbases/client")
public class ChatBaseClientController {
    @Autowired
    ChatBaseService chatBaseService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    ChatHistoryService chatHistoryService;

    @Autowired
    RedisService redisService;

    @Autowired
    ChatSessionService chatSessionService;

    @Autowired
    OuterUserService outerUserService;

    @GetMapping("/init")
    public Mono<ResponseEntity<ApiResponse<ChatInitResponse>>> getChatBaseWelcomeMessage(
            @RequestHeader("X-App-Id") String appId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader("X-Accept-Language") String language) {

        MCPChatBase mcpChatBase = chatBaseService.getChatBaseByAppId(appId);
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
                userProfile = outerUserService.getProfileFromAuth(mcpChatBase.getAuthUrl(), authorizationHeader);
            }catch (Exception e){
                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Authorization failed")));
            }
        }
        InitResult initResult = chatBaseService.getWelcomeMessage(appId, language, userProfile);
        String welcomeMessage = initResult.getMessage();
        ChatInitResponse chatInitResponse = new ChatInitResponse();
        chatInitResponse.setSessionId(finalSessionId);
        chatInitResponse.setMessage(welcomeMessage);
        return Mono.just(ResponseEntity.ok(ApiResponse.success(chatInitResponse)));
    }

    @GetMapping( value = "/history")
    public Mono<ResponseEntity<ApiResponse<List<ChatHistory>>>> queryHistory(
            @RequestHeader("X-App-Id") String appId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ){
        MCPChatBase mcpChatBase = chatBaseService.getChatBaseByAppId(appId);
        if (null == mcpChatBase) {
            return Mono.just(
                    ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error(404, "ChatBase not found.")));
        }
        Optional<ChatSession> chatSessionOptional = chatSessionService.getChatSessionById(UUID.fromString(sessionId));
        if (chatSessionOptional.isEmpty()){
            return Mono.just(ResponseEntity.ok(ApiResponse.success(new ArrayList<>())));
        }
        String userId = outerUserService.parseUserIdFromAuth(mcpChatBase.getAuthUrl(),authorizationHeader);
        if( StringUtil.isBlank(userId) ){
            return Mono.just(
                    ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error(500, "User info not found.")));
        }
        if( chatSessionOptional.get().getUserId().equals(userId)){
            List<ChatHistory> histories = chatHistoryService.queryBySessionId( chatSessionOptional.get().getId());
            return Mono.just(ResponseEntity.ok(ApiResponse.success(histories)));
        }else{
            return Mono.just(
                    ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error(404, "Chat history not found.")));
        }

    }
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> processChatMessage(@RequestHeader("X-App-Id") String appId,
                                           @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
                                           @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                           @RequestBody ChatMessageRequest request) {
        MCPChatBase mcpChatBase = chatBaseService.getChatBaseByAppId(appId);
        if (null == mcpChatBase) {
            return Flux.just("Error: ChatBase not found.");
        }
        String userProfileJson = null;
        String userId = null;
        if (mcpChatBase.getRequireAuth()) {
            if (mcpChatBase.getAuthUrl() == null || mcpChatBase.getAuthUrl().isEmpty()) {
                return Flux.just("Error: Auth URL not configured.");
            }
            if (authorizationHeader == null || authorizationHeader.isEmpty()) {
                return Flux.just("Error: Authorization header is missing.");
            }

            try {
                userProfileJson = outerUserService.getProfileFromAuth(mcpChatBase.getAuthUrl(), authorizationHeader);
            } catch (Exception e) {
                return Flux.just("Error: Authentication failed.");
            }
            userId = outerUserService.parseUserIdFromAuth(mcpChatBase.getAuthUrl(),authorizationHeader );
        }
        if( StringUtil.isBlank(userId)){
            return Flux.just("Error: Authentication failed.");
        }
        return chatBaseService.processChatMessage(
                mcpChatBase.getId(),UUID.fromString(sessionId), userId, request.getMessage(), userProfileJson);
    }

}
