package ai.jamerly.tiein.service;

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


@Slf4j
@Component
public class OpenAIRequestAssembler extends WebClientAIRequestAssembler {
    @Autowired // Autowire SystemSettingService
    private SystemSettingService systemSettingService;

    @Autowired // Autowire MCPToolService
    private MCPToolService mcpToolService;

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

        // Add tools based on groupId
        if (aiRequest.getGroupId() != null && !aiRequest.getGroupId().isEmpty()) {
            try {
                Long groupId = Long.parseLong(aiRequest.getGroupId());
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
            } catch (NumberFormatException e) {
                log.error("Invalid groupId format: {}", aiRequest.getGroupId());
            } catch (Exception e) {
                log.error("Error assembling tools for groupId {}: {}", aiRequest.getGroupId(), e.getMessage());
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
                new ArrayList<>(): new ArrayList<>(request.getHistoricalMessages());
        if( newHistoricalMessages.size() < 1 ){
            newHistoricalMessages = new ArrayList<>();
            Map<String, Object> currentUserMessage = new HashMap<>();
            currentUserMessage.put("role", "user");
            currentUserMessage.put("content", request.getPrompt());
            newHistoricalMessages.add(currentUserMessage);
        }
        request.setHistoricalMessages(newHistoricalMessages);

        // This will store the accumulated tool calls from the stream
        // Key: tool_call.id, Value: complete tool_call object (JSONObject)
        Map<String, JSONObject> accumulatedToolCallsMap = new HashMap<>();
        StringBuilder accumulatedContent = new StringBuilder();

        return super.invoke(request)
                .doOnError(HttpClientErrorException.class, httpClientErrorException -> {
                    if (httpClientErrorException.getMessage().contains("429 Too Many Requests")) {
                        log.warn("429 Too Many Requests. Consider implementing retry logic here.");
                    } else {
                        log.error("HTTP Client Error: {}", httpClientErrorException.getMessage());
                    }
                })
                .flatMap(chunk -> {
                    if ("[DONE]".equals(chunk.trim())) {
                        // If it's the end of the stream, and we have accumulated tool calls,
                        // execute them and make a follow-up OpenAI call.
                        if (!accumulatedToolCallsMap.isEmpty()) {
                            // Convert JSONObject values to Map<String, Object> for executeToolsAndFollowUp
                            List<Map<String, Object>> finalToolCalls = new ArrayList<>();
                            for (JSONObject toolCallJson : accumulatedToolCallsMap.values()) {
                                finalToolCalls.add(toolCallJson.to(Map.class));
                            }
                            return executeToolsAndFollowUp(request, finalToolCalls);
                        } else {
                            // If no tool calls, just return an empty Mono as content has already been emitted incrementally
                            return Mono.empty();
                        }
                    }
                    try {
                        JSONObject jsonChunk = JSONObject.parseObject(chunk.substring(chunk.indexOf("{")));
                        if (jsonChunk.containsKey("choices")) {
                            JSONArray choices = jsonChunk.getJSONArray("choices");
                            if (choices != null && !choices.isEmpty()) {
                                JSONObject firstChoice = choices.getJSONObject(0);
                                if (firstChoice.containsKey("delta")) {
                                    JSONObject delta = firstChoice.getJSONObject("delta");

                                    // Accumulate tool calls
                                    if (delta.containsKey("tool_calls")) {
                                        JSONArray toolCallsDelta = delta.getJSONArray("tool_calls");
                                        for (int i = 0; i < toolCallsDelta.size(); i++) {
                                            JSONObject toolCallDelta = toolCallsDelta.getJSONObject(i);
                                            String toolCallId = toolCallDelta.getString("id");
                                            if (toolCallId == null) {
                                                // If ID is null, it's a continuation of a previous tool call
                                                // Find the tool call by index
                                                int index = toolCallDelta.getInteger("index");
                                                // This assumes tool calls are always in order and index matches list position
                                                // A more robust solution would map by ID if available, or by index if ID is not yet present
                                                // For now, let's assume index is reliable for merging
                                                // This is a simplification, a real implementation might need to iterate map values
                                                // to find the tool call by its ID if it was already assigned.
                                                // For now, we'll rely on the fact that the first chunk for a tool call has an ID.
                                                // If the ID is not present, it means it's a continuation of the *last* tool call added.
                                                // This is a potential point of failure if multiple tool calls are streamed out of order.
                                                // A better approach would be to use the `index` field provided by OpenAI.
                                                // Let's use the `index` to merge.
                                                // Find the tool call by its index in the accumulated map's values
                                                JSONObject existingToolCall = null;
                                                int currentIdx = 0;
                                                for (JSONObject tc : accumulatedToolCallsMap.values()) {
                                                    if (currentIdx == index) {
                                                        existingToolCall = tc;
                                                        break;
                                                    }
                                                    currentIdx++;
                                                }

                                                if (existingToolCall != null) {
                                                    // Merge the delta into the existing tool call JSONObject
                                                    JSONObject functionJSON = toolCallDelta.getJSONObject("function");
                                                    if( functionJSON.containsKey("arguments") ){
                                                        Object functionArguments = functionJSON.get("arguments");
                                                        existingToolCall.getJSONObject("function").put("arguments",functionArguments);
                                                    }
//                                                    existingToolCall.putAll(toolCallDelta);
                                                } else {
                                                    log.warn("Could not find existing tool call to merge delta by index: {} - {}", index, toolCallDelta);
                                                }
                                            } else {
                                                // New tool call, add it to the map
                                                accumulatedToolCallsMap.put(toolCallId, toolCallDelta);
                                            }
                                        }
                                    }

                                    // Accumulate content
                                    String messageContent = delta.getString("content");
                                    if (!StringUtils.isEmpty(messageContent)) {
                                        accumulatedContent.append(messageContent);
                                    }

                                    // If it's a tool call, we don't return content yet, we wait for [DONE]
                                    if (!accumulatedToolCallsMap.isEmpty()) {
                                        return Mono.empty(); // Don't emit anything yet, wait for [DONE]
                                    } else {
                                        return Mono.just(messageContent != null ? messageContent : "");
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error parsing OpenAI SSE chunk: {} - {}", chunk, e.getMessage());
                    }
                    return Mono.empty(); // Return empty for unparseable chunks or non-content/tool-call chunks
                })
                .filter(content -> !content.isEmpty());
    }

    private Flux<String> executeToolsAndFollowUp(AIRequest originalRequest, List<Map<String, Object>> toolCalls) {
        List<Map<String, Object>> nextHistoricalMessages = new ArrayList<>(originalRequest.getHistoricalMessages());

        // Add the AI's tool_calls message to history
        Map<String, Object> assistantToolCallMessage = new HashMap<>();
        assistantToolCallMessage.put("role", "assistant");
        assistantToolCallMessage.put("tool_calls", toolCalls);
        nextHistoricalMessages.add(assistantToolCallMessage);

        // Execute tools and add tool_results to history
        for (Map<String, Object> toolCall : toolCalls) {
            String toolId = (String) toolCall.get("id");
            String toolType = (String) toolCall.get("type"); // Should be "function"
            Map<String, Object> function = (Map<String, Object>) toolCall.get("function");
            String toolName = (String) function.get("name");
            String argumentsJsonString = (String) function.get("arguments"); // Get arguments as String
            Map<String, Object> arguments;
            if (argumentsJsonString == null || argumentsJsonString.isEmpty()) {
                arguments = Collections.emptyMap(); // Return empty map if arguments string is null or empty
            } else {
                arguments = JSONObject.parseObject(argumentsJsonString).to(Map.class); // Parse arguments String to Map
            }

            Long realToolId = Long.parseLong(toolName.split("_")[1]);
            String toolReturn = mcpToolService.callTool(realToolId, arguments);

            Map<String, Object> toolResultMessage = new HashMap<>();
            toolResultMessage.put("role", "tool");
            toolResultMessage.put("tool_call_id", toolId);
            toolResultMessage.put("content", toolReturn);
            nextHistoricalMessages.add(toolResultMessage);
        }

        // Make a follow-up OpenAI call with the updated history
        AIRequest followUpRequest = new AIRequest();
        BeanUtils.copyProperties(originalRequest, followUpRequest);
        followUpRequest.setStream(Boolean.TRUE); // Ensure streaming for follow-up
        followUpRequest.setHistoricalMessages(nextHistoricalMessages);

        return super.invoke(followUpRequest);
    }
}