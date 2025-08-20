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
        Map<String,String> toolsResult = new HashMap<>();
        List<Map<String, Object>> finalNewHistoricalMessages = newHistoricalMessages;
        return super.invokeWithStream(request)
                .doOnError(HttpClientErrorException.class, httpClientErrorException -> {
                    if (httpClientErrorException.getMessage().contains("429 Too Many Requests")) {
                        log.warn("429 Too Many Requests. Consider implementing retry logic here.");
                    } else {
                        log.error("HTTP Client Error: {}", httpClientErrorException.getMessage());
                    }
                })
                .map(chunk -> {
                    if ("[DONE]".equals(chunk.trim())) {
                        return "";
                    }
                    try {
                        JSONObject jsonChunk = JSONObject.parseObject(chunk.substring(chunk.indexOf("{")));
                        if (jsonChunk.containsKey("choices")) {
                            JSONArray choices = jsonChunk.getJSONArray("choices");
                            if (choices != null && !choices.isEmpty()) {
                                JSONObject firstChoice = choices.getJSONObject(0);
                                if (firstChoice.containsKey("delta")) {
                                    JSONObject delta = firstChoice.getJSONObject("delta");
                                    JSONArray toolCalls = new JSONArray() ;
                                    if( delta.containsKey("tool_calls")){
                                        toolCalls =  delta.getJSONArray("tool_calls");
                                    }
                                    if( toolCalls.size() > 0 ){
                                        for( int i=0;i<toolCalls.size();i++){
                                            JSONObject tool = toolCalls.getJSONObject(i);
                                            String toolId = tool.getString("id");
                                            String toolType = tool.getString("type");
                                            JSONObject function = tool.getJSONObject(toolType);
                                            Object arguments = function.get("arguments");
                                            String toolName = function.getString("name");
                                            Long realToolId = Long.parseLong( toolName.split("_")[1] );
                                            String toolReturn = mcpToolService.callTool(realToolId,arguments);
                                            toolsResult.put(toolId,toolReturn);
                                        }
                                    }
                                    if( !toolsResult.isEmpty() ){
                                        List<Map<String, Object>> nextHistoricalMessages = new ArrayList<>(finalNewHistoricalMessages);
                                        toolsResult.keySet().forEach(t->{
                                            Map<String, Object> currentUserMessage = new HashMap<>();
                                            currentUserMessage.put("role", "user");
                                            currentUserMessage.put("content", request.getPrompt());
                                            JSONObject toolReplyJSON = new JSONObject();
                                            toolReplyJSON.put("type", "tool_result");
                                            toolReplyJSON.put("tool_use_id", t);
                                            toolReplyJSON.put("content", (String)toolsResult.get(t));
                                            nextHistoricalMessages.add(toolReplyJSON);
                                        });
                                        AIRequest request1 = new AIRequest();
                                        BeanUtils.copyProperties(request,request1);
                                        request1.setStream(Boolean.FALSE);
                                        request1.setHistoricalMessages(nextHistoricalMessages);
                                        return invoke(request1);
                                    }
                                    String message = delta.getString("content");
                                    if(!StringUtils.isEmpty(message)){
                                        return message;
                                    }else{
                                        return "";
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error parsing OpenAI SSE chunk: {} - {}", chunk, e.getMessage());
                    }
                    return "";
                })
                .filter(content -> !content.isEmpty());
    }
}
