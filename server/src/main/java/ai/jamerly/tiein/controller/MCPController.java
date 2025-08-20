package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.ChatMessageRequest;
import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.entity.MCPChatHistory;
import ai.jamerly.tiein.entity.MCPPrompt;
import ai.jamerly.tiein.entity.MCPResource;
import ai.jamerly.tiein.entity.MCPTool;
import ai.jamerly.tiein.service.MCPChatBaseService;
import ai.jamerly.tiein.service.MCPChatHistoryService;
import ai.jamerly.tiein.service.MCPPromptService;
import ai.jamerly.tiein.service.MCPResourceService;
import ai.jamerly.tiein.service.MCPToolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/mcp")
public class MCPController {

    @Autowired
    private MCPToolService mcpToolService;

    @Autowired
    private MCPResourceService mcpResourceService;

    @Autowired
    private MCPPromptService mcpPromptService;

    @Autowired
    private MCPChatBaseService mcpChatBaseService;

    @Autowired
    private MCPChatHistoryService mcpChatHistoryService;

    // MCPTool CRUD
    @GetMapping("/tools")
    public ResponseEntity<ApiResponse<Page<MCPTool>>> getAllTools(Pageable pageable, @RequestParam(required = false) List<Long> groupIds) {
        Page<MCPTool> tools = mcpToolService.getAllTools(pageable, groupIds);
        return ResponseEntity.ok(ApiResponse.success(tools));
    }

    @GetMapping("/tools/{id}")
    public ResponseEntity<ApiResponse<MCPTool>> getToolById(@PathVariable Long id) {
        return mcpToolService.getToolById(id)
                .map(tool -> ResponseEntity.ok(ApiResponse.success(tool)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "Tool not found")));
    }

    @PostMapping("/tools")
    public ResponseEntity<ApiResponse<MCPTool>> createTool(@RequestBody MCPTool tool) {
        MCPTool createdTool = mcpToolService.createTool(tool);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdTool));
    }

    @PutMapping("/tools/{id}")
    public ResponseEntity<ApiResponse<MCPTool>> updateTool(@PathVariable Long id, @RequestBody MCPTool tool) {
        MCPTool updatedTool = mcpToolService.updateTool(id, tool);
        if (updatedTool != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedTool));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "Tool not found"));
        }
    }

    @DeleteMapping("/tools/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTool(@PathVariable Long id) {
        mcpToolService.deleteTool(id);
        return ResponseEntity.ok(ApiResponse.success("Tool deleted successfully"));
    }

    @PostMapping("/tools/{id}/execute")
    public ResponseEntity<ApiResponse<String>> executeTool(@PathVariable Long id) {
        try {
            ai.jamerly.tiein.dto.ToolExecutionResult result = mcpToolService.executeTool(id, null); // Pass null for arguments
            if (result.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(result.getOutput()));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(500, result.getErrorMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(500, "Error executing tool: " + e.getMessage()));
        }
    }

    // MCPResource CRUD
    @GetMapping("/resources")
    public ResponseEntity<ApiResponse<Page<MCPResource>>> getAllResources(Pageable pageable, @RequestParam(required = false) List<Long> groupIds) {
        Page<MCPResource> resources = mcpResourceService.getAllResources(pageable, groupIds);
        return ResponseEntity.ok(ApiResponse.success(resources));
    }

    @GetMapping("/resources/{id}")
    public ResponseEntity<ApiResponse<MCPResource>> getResourceById(@PathVariable Long id) {
        return mcpResourceService.getResourceById(id)
                .map(resource -> ResponseEntity.ok(ApiResponse.success(resource)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "Resource not found")));
    }

    @PostMapping("/resources")
    public ResponseEntity<ApiResponse<MCPResource>> createResource(@RequestBody MCPResource resource) {
        MCPResource createdResource = mcpResourceService.createResource(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdResource));
    }

    @PutMapping("/resources/{id}")
    public ResponseEntity<ApiResponse<MCPResource>> updateResource(@PathVariable Long id, @RequestBody MCPResource resource) {
        MCPResource updatedResource = mcpResourceService.updateResource(id, resource);
        if (updatedResource != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedResource));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "Resource not found"));
        }
    }

    @DeleteMapping("/resources/{id}")
    public ResponseEntity<ApiResponse<String>> deleteResource(@PathVariable Long id) {
        mcpResourceService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully"));
    }

    // MCPPrompt CRUD
    @GetMapping("/prompts")
    public ResponseEntity<ApiResponse<Page<MCPPrompt>>> getAllPrompts(Pageable pageable, @RequestParam(required = false) List<Long> groupIds) {
        Page<MCPPrompt> prompts = mcpPromptService.getAllPrompts(pageable, groupIds);
        return ResponseEntity.ok(ApiResponse.success(prompts));
    }

    @GetMapping("/prompts/{id}")
    public ResponseEntity<ApiResponse<MCPPrompt>> getPromptById(@PathVariable Long id) {
        return mcpPromptService.getPromptById(id)
                .map(prompt -> ResponseEntity.ok(ApiResponse.success(prompt)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "Prompt not found")));
    }

    @PostMapping("/prompts")
    public ResponseEntity<ApiResponse<MCPPrompt>> createPrompt(@RequestBody MCPPrompt prompt) {
        MCPPrompt createdPrompt = mcpPromptService.createPrompt(prompt);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdPrompt));
    }

    @PutMapping("/prompts/{id}")
    public ResponseEntity<ApiResponse<MCPPrompt>> updatePrompt(@PathVariable Long id, @RequestBody MCPPrompt prompt) {
        MCPPrompt updatedPrompt = mcpPromptService.updatePrompt(id, prompt);
        if (updatedPrompt != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedPrompt));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "Prompt not found"));
        }
    }

    @DeleteMapping("/prompts/{id}")
    public ResponseEntity<ApiResponse<String>> deletePrompt(@PathVariable Long id) {
        mcpPromptService.deletePrompt(id);
        return ResponseEntity.ok(ApiResponse.success("Prompt deleted successfully"));
    }

    // MCPChatBase CRUD
    @GetMapping("/chatbases")
    public ResponseEntity<ApiResponse<Page<MCPChatBase>>> getAllChatBases(Pageable pageable) {
        Page<MCPChatBase> chatBases = mcpChatBaseService.getAllChatBases(pageable);
        return ResponseEntity.ok(ApiResponse.success(chatBases));
    }

    @GetMapping("/chatbases/{id}")
    public ResponseEntity<ApiResponse<MCPChatBase>> getChatBaseById(@PathVariable Long id) {
        return mcpChatBaseService.getChatBaseById(id)
                .map(chatBase -> ResponseEntity.ok(ApiResponse.success(chatBase)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found")));
    }

    @PostMapping("/chatbases")
    public ResponseEntity<ApiResponse<MCPChatBase>> createChatBase(@RequestBody MCPChatBase chatBase) {
        MCPChatBase createdChatBase = mcpChatBaseService.createChatBase(chatBase);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdChatBase));
    }

    @PutMapping("/chatbases/{id}")
    public ResponseEntity<ApiResponse<MCPChatBase>> updateChatBase(@PathVariable Long id, @RequestBody MCPChatBase chatBase) {
        MCPChatBase updatedChatBase = mcpChatBaseService.updateChatBase(id, chatBase);
        if (updatedChatBase != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedChatBase));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found"));
        }
    }

    @DeleteMapping("/chatbases/{id}")
    public ResponseEntity<ApiResponse<String>> deleteChatBase(@PathVariable Long id) {
        mcpChatBaseService.deleteChatBase(id);
        return ResponseEntity.ok(ApiResponse.success("ChatBase deleted successfully"));
    }

    @PatchMapping("/chatbases/{id}/status")
    public ResponseEntity<ApiResponse<MCPChatBase>> updateChatBaseStatus(@PathVariable Long id, @RequestBody MCPChatBase chatBase) {
        MCPChatBase updatedChatBase = mcpChatBaseService.updateChatBaseStatus(id, chatBase.getStatus());
        if (updatedChatBase != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedChatBase));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "ChatBase not found"));
        }
    }

    // MCPChatHistory
    @GetMapping("/chat-history")
    public ResponseEntity<ApiResponse<Page<MCPChatHistory>>> getAllChatHistory(Pageable pageable) {
        Page<MCPChatHistory> chatHistory = mcpChatHistoryService.getChatHistory(pageable);
        return ResponseEntity.ok(ApiResponse.success(chatHistory));
    }

    @GetMapping("/chat-history/chatbase/{chatBaseId}")
    public ResponseEntity<ApiResponse<Page<MCPChatHistory>>> getChatHistoryByChatBaseId(@PathVariable Long chatBaseId, Pageable pageable) {
        Page<MCPChatHistory> chatHistory = mcpChatHistoryService.getChatHistoryByChatBaseId(chatBaseId, pageable);
        return ResponseEntity.ok(ApiResponse.success(chatHistory));
    }

    // Chat Interaction (Streaming)
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> processChatMessage(@RequestBody ChatMessageRequest request) {
        // For now, assuming userId is 1L (hardcoded for testing)
        return mcpChatBaseService.processChatMessage(request.getChatBaseId(), 1L, request.getMessage());
    }

    @GetMapping("/tools/count")
    public ResponseEntity<ApiResponse<Long>> getToolCount() {
        long count = mcpToolService.countTools();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/resources/count")
    public ResponseEntity<ApiResponse<Long>> getResourceCount() {
        long count = mcpResourceService.countResources();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/prompts/count")
    public ResponseEntity<ApiResponse<Long>> getPromptCount() {
        long count = mcpPromptService.countPrompts();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/chatbases/count")
    public ResponseEntity<ApiResponse<Long>> getChatBaseCount() {
        long count = mcpChatBaseService.countChatBases();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}