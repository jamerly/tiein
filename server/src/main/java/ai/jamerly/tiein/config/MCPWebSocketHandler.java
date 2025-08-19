package ai.jamerly.tiein.config;

import ai.jamerly.tiein.dto.CompleteRequestParams;
import ai.jamerly.tiein.dto.CompleteResult;
import ai.jamerly.tiein.dto.PromptDto;
import ai.jamerly.tiein.dto.ResourceDto;
import ai.jamerly.tiein.dto.ToolDto;
import ai.jamerly.tiein.entity.MCPPrompt;
import ai.jamerly.tiein.entity.MCPResource;
import ai.jamerly.tiein.entity.MCPTool;
import ai.jamerly.tiein.entity.User;
import ai.jamerly.tiein.repository.UserRepository;
import ai.jamerly.tiein.service.CompletionService;
import ai.jamerly.tiein.service.MCPPromptService;
import ai.jamerly.tiein.service.MCPResourceService;
import ai.jamerly.tiein.service.MCPToolService;
import ai.jamerly.tiein.util.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class MCPWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MCPToolService mcpToolService;

    @Autowired
    private MCPResourceService mcpResourceService;

    @Autowired
    private MCPPromptService mcpPromptService;

    @Autowired
    private CompletionService completionService;

    public static final String USERNAME_SESSION_ATTRIBUTE = "username";
    public static final String ROLE_SESSION_ATTRIBUTE = "role";

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("WebSocket connection established: " + session.getId());

        String token = UriComponentsBuilder.fromUri(session.getUri())
                .build()
                .getQueryParams()
                .getFirst("token");

        if (token == null) {
            session.close(new CloseStatus(CloseStatus.BAD_DATA.getCode(), "Authentication token missing."));
            return;
        }

        try {
            String username = jwtUtil.extractUsername(token);
            if (username == null || !jwtUtil.validateToken(token, username)) {
                session.close(new CloseStatus(CloseStatus.POLICY_VIOLATION.getCode(), "Invalid or expired token."));
                return;
            }

            Optional<User> userOptional = userRepository.findByUsername(username);
            if (userOptional.isEmpty()) {
                session.close(new CloseStatus(CloseStatus.POLICY_VIOLATION.getCode(), "User not found."));
                return;
            }

            User user = userOptional.get();
            session.getAttributes().put(USERNAME_SESSION_ATTRIBUTE, user.getUsername());
            session.getAttributes().put(ROLE_SESSION_ATTRIBUTE, user.getRole());
            System.out.println("User " + user.getUsername() + " connected with role " + user.getRole());

        } catch (Exception e) {
            System.err.println("Authentication error: " + e.getMessage());
            session.close(new CloseStatus(CloseStatus.SERVER_ERROR.getCode(), "Authentication failed."));
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        // Ensure session is authenticated before processing messages
        if (!session.getAttributes().containsKey(USERNAME_SESSION_ATTRIBUTE)) {
            sendError(session, null, -32000, "Not authenticated");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        String payload = message.getPayload();
        System.out.println("Received message: " + payload);

        try {
            JsonNode rootNode = objectMapper.readTree(payload);

            JsonNode idNode = rootNode.get("id");
            JsonNode methodNode = rootNode.get("method");
            JsonNode paramsNode = rootNode.get("params");

            if (methodNode == null || !methodNode.isTextual()) {
                sendError(session, idNode, -32600, "Invalid Request: 'method' field missing or not a string");
                return;
            }

            String method = methodNode.asText();
            System.out.println("Method: " + method);

            switch (method) {
                case "initialize":
                    handleInitialize(session, idNode, paramsNode);
                    break;
                case "ping":
                    handlePing(session, idNode);
                    break;
                case "tools/call":
                    handleToolsCall(session, idNode, paramsNode);
                    break;
                case "tools/list":
                    handleToolsList(session, idNode, paramsNode);
                    break;
                case "resources/list":
                    handleResourcesList(session, idNode, paramsNode);
                    break;
                case "resources/read":
                    handleResourcesRead(session, idNode, paramsNode);
                    break;
                case "prompts/list":
                    handlePromptsList(session, idNode, paramsNode);
                    break;
                case "prompts/get":
                    handlePromptsGet(session, idNode, paramsNode);
                    break;
                case "completion/complete":
                    handleCompletionComplete(session, idNode, paramsNode);
                    break;
                // Add other MCP methods here
                default:
                    sendError(session, idNode, -32601, "Method not found: " + method);
                    break;
            }

        } catch (IOException e) {
            System.err.println("Error parsing WebSocket message: " + e.getMessage());
            sendError(session, null, -32700, "Parse error");
        } catch (Exception e) {
            System.err.println("Error processing WebSocket message: " + e.getMessage());
            sendError(session, null, -32000, "Server error: " + e.getMessage());
        }
    }

    private void handleInitialize(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        // For now, just send a success response with a protocol version
        ObjectNode result = objectMapper.createObjectNode();
        result.put("protocolVersion", "2025-06-18"); // Example protocol version
        // Add capabilities based on paramsNode if needed

        sendResponse(session, idNode, result);
    }

    private void handlePing(WebSocketSession session, JsonNode idNode) throws IOException {
        sendResponse(session, idNode, objectMapper.createObjectNode()); // Empty result for ping
    }

    private void handleToolsCall(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        if (paramsNode == null || !paramsNode.has("name")) {
            sendError(session, idNode, -32602, "Invalid params for tools/call: 'name' is required.");
            return;
        }

        String toolName = paramsNode.get("name").asText();
        JsonNode argumentsNode = paramsNode.get("arguments"); // Can be null

        try {
            ai.jamerly.tiein.entity.MCPTool tool = mcpToolService.getToolByName(toolName)
                    .orElseThrow(() -> new IllegalArgumentException("Tool not found: " + toolName));

            // Convert JsonNode arguments to Map<String, Object>
            Map<String, Object> arguments = null;
            if (argumentsNode != null && argumentsNode.isObject()) {
                arguments = objectMapper.convertValue(argumentsNode, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            }

            ai.jamerly.tiein.dto.ToolExecutionResult executionResult = mcpToolService.executeTool(tool.getId(), arguments);

            ObjectNode resultNode = objectMapper.createObjectNode();
            if (executionResult.isSuccess()) {
                resultNode.put("isError", false);
                resultNode.set("structuredContent", objectMapper.readTree(executionResult.getOutput()));
            } else {
                resultNode.put("isError", true);
                resultNode.put("errorMessage", executionResult.getErrorMessage());
            }

            sendResponse(session, idNode, resultNode);

        } catch (IllegalArgumentException e) {
            sendError(session, idNode, -32000, e.getMessage()); // Tool not found
        } catch (Exception e) {
            sendError(session, idNode, -32000, "Error executing tool: " + e.getMessage());
        }
    }

    private void handleToolsList(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        try {
            List<MCPTool> mcpTools = mcpToolService.getAllTools();
            ArrayNode toolsArray = objectMapper.createArrayNode();

            for (MCPTool mcpTool : mcpTools) {
                ToolDto toolDto = new ToolDto();
                toolDto.setName(mcpTool.getName());
                toolDto.setDescription(mcpTool.getDescription());

                if (mcpTool.getInputSchemaJson() != null && !mcpTool.getInputSchemaJson().isEmpty()) {
                    toolDto.setInputSchema(objectMapper.readTree(mcpTool.getInputSchemaJson()));
                }
                if (mcpTool.getOutputSchemaJson() != null && !mcpTool.getOutputSchemaJson().isEmpty()) {
                    toolDto.setOutputSchema(objectMapper.readTree(mcpTool.getOutputSchemaJson()));
                }

                toolsArray.add(objectMapper.valueToTree(toolDto));
            }

            ObjectNode result = objectMapper.createObjectNode();
            result.set("tools", toolsArray);

            sendResponse(session, idNode, result);

        } catch (Exception e) {
            sendError(session, idNode, -32000, "Error listing tools: " + e.getMessage());
        }
    }

    private void handleResourcesList(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        try {
            List<MCPResource> mcpResources = mcpResourceService.getAllResources();
            ArrayNode resourcesArray = objectMapper.createArrayNode();

            for (MCPResource mcpResource : mcpResources) {
                ResourceDto resourceDto = new ResourceDto();
                resourceDto.setUri(mcpResource.getUri());
                resourceDto.setDescription(mcpResource.getDescription());
                resourceDto.setContentType(mcpResource.getContentType());
                resourcesArray.add(objectMapper.valueToTree(resourceDto));
            }

            ObjectNode result = objectMapper.createObjectNode();
            result.set("resources", resourcesArray);

            sendResponse(session, idNode, result);

        } catch (Exception e) {
            sendError(session, idNode, -32000, "Error listing resources: " + e.getMessage());
        }
    }

    private void handleResourcesRead(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        if (paramsNode == null || !paramsNode.has("uri")) {
            sendError(session, idNode, -32602, "Invalid params for resources/read: 'uri' is required.");
            return;
        }

        String uri = paramsNode.get("uri").asText();

        try {
            MCPResource mcpResource = mcpResourceService.getResourceByUri(uri)
                    .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + uri));

            ObjectNode result = objectMapper.createObjectNode();
            result.put("uri", mcpResource.getUri());
            result.put("content", mcpResource.getContent());
            result.put("contentType", mcpResource.getContentType());

            sendResponse(session, idNode, result);

        } catch (IllegalArgumentException e) {
            sendError(session, idNode, -32000, e.getMessage()); // Resource not found
        } catch (Exception e) {
            sendError(session, idNode, -32000, "Error reading resource: " + e.getMessage());
        }
    }

    private void handlePromptsList(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        try {
            List<MCPPrompt> mcpPrompts = mcpPromptService.getAllPrompts();
            ArrayNode promptsArray = objectMapper.createArrayNode();

            for (MCPPrompt mcpPrompt : mcpPrompts) {
                PromptDto promptDto = new PromptDto();
                promptDto.setName(mcpPrompt.getName());
                promptDto.setDescription(mcpPrompt.getDescription());
                promptDto.setContent(mcpPrompt.getContent());

                if (mcpPrompt.getInputSchemaJson() != null && !mcpPrompt.getInputSchemaJson().isEmpty()) {
                    promptDto.setInputSchema(objectMapper.readTree(mcpPrompt.getInputSchemaJson()));
                }
                if (mcpPrompt.getOutputSchemaJson() != null && !mcpPrompt.getOutputSchemaJson().isEmpty()) {
                    promptDto.setOutputSchema(objectMapper.readTree(mcpPrompt.getOutputSchemaJson()));
                }

                promptsArray.add(objectMapper.valueToTree(promptDto));
            }

            ObjectNode result = objectMapper.createObjectNode();
            result.set("prompts", promptsArray);

            sendResponse(session, idNode, result);

        } catch (Exception e) {
            sendError(session, idNode, -32000, "Error listing prompts: " + e.getMessage());
        }
    }

    private void handlePromptsGet(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        if (paramsNode == null || !paramsNode.has("name")) {
            sendError(session, idNode, -32602, "Invalid params for prompts/get: 'name' is required.");
            return;
        }

        String promptName = paramsNode.get("name").asText();

        try {
            MCPPrompt mcpPrompt = mcpPromptService.getPromptByName(promptName)
                    .orElseThrow(() -> new IllegalArgumentException("Prompt not found: " + promptName));

            ObjectNode result = objectMapper.createObjectNode();
            result.put("name", mcpPrompt.getName());
            result.put("content", mcpPrompt.getContent());
            result.put("description", mcpPrompt.getDescription());

            if (mcpPrompt.getInputSchemaJson() != null && !mcpPrompt.getInputSchemaJson().isEmpty()) {
                result.set("inputSchema", objectMapper.readTree(mcpPrompt.getInputSchemaJson()));
            }
            if (mcpPrompt.getOutputSchemaJson() != null && !mcpPrompt.getOutputSchemaJson().isEmpty()) {
                result.set("outputSchema", objectMapper.readTree(mcpPrompt.getOutputSchemaJson()));
            }

            sendResponse(session, idNode, result);

        } catch (IllegalArgumentException e) {
            sendError(session, idNode, -32000, e.getMessage()); // Prompt not found
        } catch (Exception e) {
            sendError(session, idNode, -32000, "Error getting prompt: " + e.getMessage());
        }
    }

    private void handleCompletionComplete(WebSocketSession session, JsonNode idNode, JsonNode paramsNode) throws IOException {
        if (paramsNode == null || !paramsNode.has("ref") || !paramsNode.has("argument")) {
            sendError(session, idNode, -32602, "Invalid params for completion/complete: 'ref' and 'argument' are required.");
            return;
        }

        try {
            CompleteRequestParams requestParams = objectMapper.treeToValue(paramsNode, CompleteRequestParams.class);
            CompleteResult completionResult = completionService.complete(requestParams);

            ObjectNode resultNode = objectMapper.createObjectNode();
            if (completionResult.isError()) {
                resultNode.put("isError", true);
                resultNode.put("errorMessage", completionResult.getErrorMessage());
            } else {
                resultNode.put("isError", false);
                resultNode.put("content", completionResult.getContent());
                if (completionResult.getStructuredContent() != null) {
                    resultNode.set("structuredContent", completionResult.getStructuredContent());
                }
            }

            sendResponse(session, idNode, resultNode);

        } catch (Exception e) {
            sendError(session, idNode, -32000, "Error completing: " + e.getMessage());
        }
    }

    private void sendResponse(WebSocketSession session, JsonNode idNode, JsonNode result) throws IOException {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("jsonrpc", "2.0");
        if (idNode != null) {
            response.set("id", idNode);
        }
        response.set("result", result);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
    }

    private void sendError(WebSocketSession session, JsonNode idNode, int code, String message) throws IOException {
        ObjectNode error = objectMapper.createObjectNode();
        error.put("code", code);
        error.put("message", message);

        ObjectNode response = objectMapper.createObjectNode();
        response.put("jsonrpc", "2.0");
        if (idNode != null) {
            response.set("id", idNode);
        }
        response.set("error", error);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("WebSocket connection closed: " + session.getId() + " with status: " + status);
    }
}