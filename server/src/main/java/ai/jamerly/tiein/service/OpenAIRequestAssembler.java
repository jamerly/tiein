package ai.jamerly.tiein.service;

import ai.jamerly.tiein.util.BizException;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Component
public class OpenAIRequestAssembler extends WebClientAIRequestAssembler {
    @Autowired // Autowire SystemSettingService
    private SystemSettingService systemSettingService;

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

        return super.invoke(request)
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
                                    if (delta.containsKey("content")) {
                                        return delta.getString("content");
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
