package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.entity.*;
import ai.jamerly.tiein.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chatbases")
public class ChatBaseController {

    @Autowired
    private MCPToolService mcpToolService;

    @Autowired
    private MCPResourceService mcpResourceService;

    @Autowired
    private MCPPromptService mcpPromptService;

    @Autowired
    private ChatBaseService chatBaseService;

    @Autowired
    private ChatHistoryService chatHistoryService;

    @Autowired
    ChatSessionService chatSessionService;

    // MCPChatBase CRUD
    @GetMapping()
    public ResponseEntity<ApiResponse<Page<MCPChatBase>>> getAllChatBases(Pageable pageable) {
        Page<MCPChatBase> chatBases = chatBaseService.getAllChatBases(pageable);
        return ResponseEntity.ok(ApiResponse.success(chatBases));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MCPChatBase>> getChatBaseById(@PathVariable Long id) {
        return chatBaseService.getChatBaseById(id)
                .map(chatBase -> ResponseEntity.ok(ApiResponse.success(chatBase)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found")));
    }

    @GetMapping("/{id}/sessions/{sessionId}/history")
    public ResponseEntity<ApiResponse<Page<ChatHistory>>> getChatHistory(
            Pageable pageable,
            @PathVariable("id") Long chatId,
            @PathVariable("sessionId") String sessionId) {
        Page<ChatHistory> chatHistories = chatHistoryService.getChatHistoryBySessionId(UUID.fromString(sessionId),pageable);
        return ResponseEntity.ok(ApiResponse.success(chatHistories));
    }

    @GetMapping("/{id}/sessions")
    public ResponseEntity<ApiResponse<Page<ChatSession>>> getSessionList(Pageable pageable,@PathVariable("id") Long chatBaseId){
        Page<ChatSession> chatSessionPage = chatSessionService.querySessions(pageable,chatBaseId);
        return ResponseEntity.ok(ApiResponse.success(chatSessionPage));
    }

    @PostMapping()
    public ResponseEntity<ApiResponse<MCPChatBase>> createChatBase(@RequestBody MCPChatBase chatBase) {
        MCPChatBase createdChatBase = chatBaseService.createChatBase(chatBase);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdChatBase));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MCPChatBase>> updateChatBase(@PathVariable Long id, @RequestBody MCPChatBase chatBase) {
        MCPChatBase updatedChatBase = chatBaseService.updateChatBase(id, chatBase);
        if (updatedChatBase != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedChatBase));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteChatBase(@PathVariable Long id) {
        chatBaseService.deleteChatBase(id);
        return ResponseEntity.ok(ApiResponse.success("ChatBase deleted successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MCPChatBase>> updateChatBaseStatus(@PathVariable Long id, @RequestBody MCPChatBase chatBase) {
        MCPChatBase updatedChatBase = chatBaseService.updateChatBaseStatus(id, chatBase.getStatus());
        if (updatedChatBase != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedChatBase));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found"));
        }
    }

    @PatchMapping("/{id}/regenerate-appid")
    public ResponseEntity<ApiResponse<MCPChatBase>> regenerateAppId(@PathVariable Long id) {
        MCPChatBase updatedChatBase = chatBaseService.regenerateAppId(id);
        if (updatedChatBase != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedChatBase));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found"));
        }
    }
}