package ai.jamerly.tiein.service;

import ai.jamerly.tiein.dto.ToolExecutionResult;
import ai.jamerly.tiein.util.BizException;
import com.alibaba.druid.util.StringUtils;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.internal.StringUtil;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

import ai.jamerly.tiein.entity.MCPTool;
import ai.jamerly.tiein.entity.MCPResource;
import ai.jamerly.tiein.service.MCPResourceService;


@Slf4j
@Component
public class OpenAIRequestAssembler extends WebClientAIRequestAssembler {
    @Autowired // Autowire SystemSettingService
    private SystemSettingService systemSettingService;

    @Autowired // Autowire MCPToolService
    private MCPToolService mcpToolService;

    @Autowired // Autowire MCPResourceService
    private MCPResourceService mcpResourceService;

    private String apiUrl = "https://api.openai.com/v1/chat/completions";


    @Override
    public HttpEntity<?> assembleRequest(AIRequest aiRequest) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String openaiApiKey = systemSettingService.getOpenAIApiKey(); // Get API key from service
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            throw new BizException("OpenAI API Key is not configured in system settings.", 500);
        }
        headers.setBearerAuth(openaiApiKey);

        JSONObject requestBody = new JSONObject();
        requestBody.put("model", "gpt-3.5-turbo");
        requestBody.put("messages", aiRequest.getHistoricalMessages());
        requestBody.put("max_tokens", aiRequest.getMaxToken());
//        requestBody.put("temperature", aiRequest.getTemperature());
        requestBody.put("stream", true);

        // Add tools and resources based on groupId
        if (aiRequest.getGroupId() != null && !aiRequest.getGroupId().isEmpty()) {
            try {
                Long groupId = Long.parseLong(aiRequest.getGroupId());

                // Add tools
                List<MCPTool> tools = mcpToolService.getToolsByGroupId(groupId);
                if (!tools.isEmpty()) {
                    JSONArray toolsArray = new JSONArray();
                    for (MCPTool tool : tools) {
                        JSONObject toolObject = new JSONObject();
                        toolObject.put("type", "function");
                        JSONObject functionObject = new JSONObject();
                        functionObject.put("name", "tool_" + tool.getId());
                        functionObject.put("description", tool.getName() + ":"+ tool.getDescription());
                        if (tool.getInputSchemaJson() != null && !tool.getInputSchemaJson().isEmpty()) {
                            functionObject.put("parameters", JSONObject.parseObject(tool.getInputSchemaJson()));
                        }
                        toolObject.put("function", functionObject);
                        toolsArray.add(toolObject);
                    }
                    requestBody.put("tools", toolsArray);
                }

                // Add resources to system message
                List<ai.jamerly.tiein.entity.MCPResource> resources = mcpResourceService.getResourcesByGroupId(groupId);
                if (!resources.isEmpty()) {
                    StringBuilder resourceContent = new StringBuilder();
                    resourceContent.append("\n\nAvailable Resources:\n");
                    for (ai.jamerly.tiein.entity.MCPResource resource : resources) {
                        resourceContent.append("--- Resource Name: ").append(resource.getName()).append(" ---\n");
                        resourceContent.append(resource.getContent()).append("\n");
                    }

                    // Find or create a system message to append resource content
                    List<Map<String, Object>> messages = (List<Map<String, Object>>) requestBody.get("messages");
                    Optional<Map<String, Object>> systemMessageOptional = messages.stream()
                            .filter(m -> "system".equals(m.get("role")))
                            .findFirst();

                    if (systemMessageOptional.isPresent()) {
                        Map<String, Object> systemMessage = systemMessageOptional.get();
                        String currentContent = (String) systemMessage.get("content");
                        systemMessage.put("content", currentContent + resourceContent.toString());
                    } else {
                        Map<String, Object> newSystemMessage = new HashMap<>();
                        newSystemMessage.put("role", "system");
                        newSystemMessage.put("content", resourceContent.toString());
                        messages.add(0, newSystemMessage); // Add as the first message
                    }
                }

            } catch (NumberFormatException e) {
                log.error("Invalid groupId format: {}", aiRequest.getGroupId());
            } catch (Exception e) {
                log.error("Error assembling tools or resources for groupId {}: {}", aiRequest.getGroupId(), e.getMessage());
            }
        }

        return new HttpEntity<>(requestBody.toJSONString(), headers);
    }

    @Override
    public String getApiUrl() {
        return apiUrl;
    }

    @Override
    public Flux<String> invoke(AIRequest request) {
        List<Map<String, Object>> newHistoricalMessages = request.getHistoricalMessages() == null ?
                new ArrayList<>() : new ArrayList<>(request.getHistoricalMessages());
        if (newHistoricalMessages.isEmpty()) {
            Map<String, Object> currentUserMessage = new HashMap<>();
            currentUserMessage.put("role", "user");
            currentUserMessage.put("content", request.getPrompt());
            newHistoricalMessages.add(currentUserMessage);
        }
        request.setHistoricalMessages(newHistoricalMessages);

        return super.invoke(request)
                .doOnError(HttpClientErrorException.class, e -> {
                    log.error("HTTP Client Error: {}", e.getMessage());
                })
                .filter(chunk -> !"[DONE]".equals(chunk.trim()))
                .collectList()
                .flatMapMany(chunks -> {
                    Map<String, JSONObject> accumulatedToolCallsMap = new HashMap<>();
                    List<String> contentChunks = new ArrayList<>();

                    for (String chunk : chunks) {
                        try {
                            JSONObject jsonChunk = JSONObject.parseObject(chunk.substring(chunk.indexOf("{")));
                            if (jsonChunk.containsKey("choices")) {
                                JSONArray choices = jsonChunk.getJSONArray("choices");
                                if (choices != null && !choices.isEmpty()) {
                                    JSONObject firstChoice = choices.getJSONObject(0);
                                    if (firstChoice.containsKey("delta")) {
                                        JSONObject delta = firstChoice.getJSONObject("delta");

                                        if (delta.containsKey("tool_calls")) {
                                            JSONArray toolCallsDelta = delta.getJSONArray("tool_calls");
                                            for (int i = 0; i < toolCallsDelta.size(); i++) {
                                                JSONObject toolCallDelta = toolCallsDelta.getJSONObject(i);
                                                String toolCallId = toolCallDelta.getString("id");

                                                if (toolCallId != null) {
                                                    accumulatedToolCallsMap.put(toolCallId, toolCallDelta);
                                                } else {
                                                    int index = toolCallDelta.getInteger("index");
                                                    List<JSONObject> toolCallList = new ArrayList<>(accumulatedToolCallsMap.values());
                                                    if(index < toolCallList.size()){
                                                        JSONObject existingToolCall = toolCallList.get(index);
                                                        if (existingToolCall != null) {
                                                            JSONObject functionDelta = toolCallDelta.getJSONObject("function");
                                                            if (functionDelta != null && functionDelta.containsKey("arguments")) {
                                                                String argsChunk = functionDelta.getString("arguments");
                                                                JSONObject existingFunction = existingToolCall.getJSONObject("function");
                                                                String existingArgs = existingFunction.getString("arguments");
                                                                existingFunction.put("arguments", existingArgs + argsChunk);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        } else if (delta.containsKey("content")) {
                                            contentChunks.add(chunk);
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("Error parsing OpenAI SSE chunk: {} - {}", chunk, e.getMessage());
                        }
                    }

                    if (!accumulatedToolCallsMap.isEmpty()) {
                        List<Map<String, Object>> finalToolCalls = new ArrayList<>();
                        for (JSONObject toolCallJson : accumulatedToolCallsMap.values()) {
                            finalToolCalls.add(toolCallJson.to(Map.class));
                        }
                        
                        // Execute tools and make a follow-up call
                        AIRequest followUpRequest = createFollowUpRequest(request, finalToolCalls);
                        return super.invoke(followUpRequest)
                                .filter(followUpChunk -> !"[DONE]".equals(followUpChunk.trim()));

                    } else {
                        return Flux.fromIterable(contentChunks);
                    }
                })
                .map(chunk -> {
                    try {
                        JSONObject jsonChunk = JSONObject.parseObject(chunk);
                        if (jsonChunk.containsKey("choices")) {
                            JSONArray choices = jsonChunk.getJSONArray("choices");
                            if (choices != null && !choices.isEmpty()) {
                                JSONObject firstChoice = choices.getJSONObject(0);
                                if (firstChoice.containsKey("delta")) {
                                    JSONObject delta = firstChoice.getJSONObject("delta");
                                    if (delta.containsKey("content")) {
                                        String content = delta.getString("content");
                                        if (content != null && !content.isEmpty()) {
                                            return content;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error parsing or processing SSE chunk: {} - {}", chunk, e.getMessage());
                    }
                    return ""; // Return empty string for non-content chunks or errors
                })
                .filter(content -> !content.isEmpty())
                .map(data ->{
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("chunk", data);
                    return JSONObject.toJSONString(jsonObject);
                })
                .concatWith(Flux.just("[DONE]"));
    }

    private AIRequest createFollowUpRequest(AIRequest originalRequest, List<Map<String, Object>> toolCalls) {
        List<Map<String, Object>> nextHistoricalMessages = new ArrayList<>(originalRequest.getHistoricalMessages());

        // Add the AI's tool_calls message to history
        Map<String, Object> assistantToolCallMessage = new HashMap<>();
        assistantToolCallMessage.put("role", "assistant");
        assistantToolCallMessage.put("tool_calls", toolCalls);
        nextHistoricalMessages.add(assistantToolCallMessage);

        // Execute tools and add tool_results to history
        for (Map<String, Object> toolCall : toolCalls) {
            String toolId = (String) toolCall.get("id");
            Map<String, Object> function = (Map<String, Object>) toolCall.get("function");
            String toolName = (String) function.get("name");
            String argumentsJsonString = (String) function.get("arguments");
            Map<String, Object> arguments;
            if (argumentsJsonString == null || argumentsJsonString.isEmpty()) {
                arguments = Collections.emptyMap();
            } else {
                arguments = JSONObject.parseObject(argumentsJsonString).to(Map.class);
            }

            Long realToolId = Long.parseLong(toolName.split("_")[1]);

            ToolExecutionResult result = mcpToolService.executeTool(realToolId,arguments);
            Map<String, Object> toolResultMessage = new HashMap<>();
            toolResultMessage.put("role", "tool");
            toolResultMessage.put("tool_call_id", toolId);
            if( !result.isSuccess() ){
                toolResultMessage.put("is_error", true);
            }
            toolResultMessage.put("content", result.getOutput());
            nextHistoricalMessages.add(toolResultMessage);
        }

        // Make a follow-up OpenAI call with the updated history
        AIRequest followUpRequest = new AIRequest();
        BeanUtils.copyProperties(originalRequest, followUpRequest);
        followUpRequest.setStream(Boolean.TRUE);
        followUpRequest.setHistoricalMessages(nextHistoricalMessages);

        return followUpRequest;
    }
}