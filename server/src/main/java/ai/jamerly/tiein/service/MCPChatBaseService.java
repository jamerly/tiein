package ai.jamerly.tiein.service;

import ai.jamerly.tiein.dto.InitResult;
import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.entity.MCPChatHistory;
import ai.jamerly.tiein.repository.MCPChatBaseRepository;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hibernate.mapping.Join;
import org.jsoup.internal.StringUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MCPChatBaseService {

    @Autowired
    private MCPChatBaseRepository mcpChatBaseRepository;

    @Autowired
    private ObjectMapper objectMapper; // Keep for potential future use or other JSON operations

    @Autowired
    private MCPChatHistoryService mcpChatHistoryService;

    @Autowired
    private OpenAIRequestAssembler openAIRequestAssembler;

    public Page<MCPChatBase> getAllChatBases(Pageable pageable) {
        return mcpChatBaseRepository.findAll(pageable);
    }

    public Optional<MCPChatBase> getChatBaseById(Long id) {
        return mcpChatBaseRepository.findById(id);
    }

    public MCPChatBase createChatBase(MCPChatBase chatBase) {
        chatBase.setAppId(generateAppId());
        // groupIdsJson will be set by the entity's setGroupIds method
        return mcpChatBaseRepository.save(chatBase);
    }

    private String generateAppId() {
        String uuid1 = UUID.randomUUID().toString().replace("-", "");
        String uuid2 = UUID.randomUUID().toString().replace("-", "");
        return (uuid1 + uuid2);
    }

    public MCPChatBase updateChatBase(Long id, MCPChatBase chatBaseDetails) {
        return mcpChatBaseRepository.findById(id)
                .map(chatBase -> {
                    chatBase.setName(chatBaseDetails.getName());
                    chatBase.setRolePrompt(chatBaseDetails.getRolePrompt());
                    chatBase.setGreeting(chatBaseDetails.getGreeting());
                    chatBase.setStatus(chatBaseDetails.getStatus());
                    chatBase.setRequireAuth(chatBaseDetails.getRequireAuth());
                    chatBase.setAuthUrl(chatBaseDetails.getAuthUrl());
                    chatBase.setGroupIds(chatBaseDetails.getGroupIds()); // This will update groupIdsJson internally
                    return mcpChatBaseRepository.save(chatBase);
                }).orElse(null);
    }

    public void deleteChatBase(Long id) {
        mcpChatBaseRepository.deleteById(id);
    }

    public MCPChatBase regenerateAppId(Long id) {
        return mcpChatBaseRepository.findById(id)
                .map(chatBase -> {
                    chatBase.setAppId(generateAppId());
                    return mcpChatBaseRepository.save(chatBase);
                }).orElse(null);
    }

    public MCPChatBase updateChatBaseStatus(Long id, MCPChatBase.Status status) {
        return mcpChatBaseRepository.findById(id)
                .map(chatBase -> {
                    chatBase.setStatus(status);
                    return mcpChatBaseRepository.save(chatBase);
                }).orElse(null);
    }

    public long countChatBases() {
        return mcpChatBaseRepository.count();
    }

    public MCPChatBase getChatBaseByAppId(String appId){
        return  mcpChatBaseRepository.findByAppId(appId).orElse(null);
    }
    public InitResult getWelcomeMessage(String appId, String language, String userProfileJson) {
        Optional<MCPChatBase> chatBaseOptional = mcpChatBaseRepository.findByAppId(appId);
        InitResult initResult = new InitResult();
        if (chatBaseOptional.isEmpty()) {
            initResult.setMessage("ChatBase not found.");
        }
        MCPChatBase chatBase = chatBaseOptional.get();

        if (chatBase.getGreeting() == null || chatBase.getGreeting().isEmpty()) {
            chatBase.setGreeting("Welcome");
        }

        String prompt = String.format("Given the user profile %s, " +
                "translate the following greeting into %s and make it sound welcoming: \"%s\" using JSON format: " +
                "```{ \"greeting\" : \"generated greeting\" , \"userId\": \"userId or username from userprofile\" }```", userProfileJson, language, chatBase.getGreeting());
        AIRequest aiRequest = new AIRequest();
        aiRequest.setPrompt(prompt);
        aiRequest.setModel("gpt-3.5-turbo"); // Or another appropriate model
        aiRequest.setStream(Boolean.FALSE); // Not streaming for a single welcome message
        // Invoke OpenAIRequestAssembler and block to get the result
        // This is a simplified approach. For production, consider async handling or a dedicated AI service.
        Flux<String> aiResponseFlux = openAIRequestAssembler.invoke(aiRequest);
        List<String> greetingJSON = aiResponseFlux.collectList().block().stream().map(t->{
            if(!StringUtil.isBlank(t)){
                if( "[DONE]".equals(t.trim()) ){
                    return "";
                }else{
                    JSONObject jsonObject = JSONObject.parseObject(t.trim());
                    return jsonObject.getString("chunk");
                }
            }
            return "";
        }).collect(Collectors.toList());
        String JSONString =  greetingJSON.stream().collect(Collectors.joining());
        JSONObject greeting = JSONObject.parseObject(JSONString);
        initResult.setSuccess(Boolean.TRUE);
        initResult.setUserId(greeting.getString("userId"));
        initResult.setMessage(greeting.getString("greeting"));
        return initResult;
    }

    public Flux<String> processChatMessage(Long chatBaseId, Long userId, String userMessage, String userProfileJson) {
        Optional<MCPChatBase> chatBaseOptional = mcpChatBaseRepository.findById(chatBaseId);
        if (chatBaseOptional.isEmpty()) {
            return Flux.just("Error: ChatBase not found.");
        }
        MCPChatBase chatBase = chatBaseOptional.get();

        AIRequest aiRequest = new AIRequest();
        aiRequest.setPrompt(userMessage);
        aiRequest.setModel("gpt-3.5-turbo"); // Or another appropriate model
        aiRequest.setStream(Boolean.TRUE); // Set to TRUE for streaming

        List<Map<String, Object>> historicalMessages = new ArrayList<>();

        if(!StringUtil.isBlank(userProfileJson)){
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "User Profile is : " + userProfileJson);
        }
        // Add role prompt as a system message
        Map<String, Object> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        String systemContent = chatBase.getRolePrompt();
        systemMessage.put("content", systemContent);
        historicalMessages.add(systemMessage);
        // Add user message to historical messages (OpenAIRequestAssembler will also add it as prompt)
        Map<String, Object> userMsgMap = new HashMap<>();
        userMsgMap.put("role", "user");
        userMsgMap.put("content", userMessage);
        historicalMessages.add(userMsgMap);

        aiRequest.setHistoricalMessages(historicalMessages);

        // Set groupId if available
        if (chatBase.getGroupIds() != null && !chatBase.getGroupIds().isEmpty()) {
            aiRequest.setGroupId(String.valueOf(chatBase.getGroupIds().get(0)));
        }

        // Invoke OpenAIRequestAssembler
        Flux<String> aiResponseFlux = openAIRequestAssembler.invoke(aiRequest);

        // Collect the full response for saving history, but return the Flux for streaming
        return aiResponseFlux.doOnComplete(() -> {
            // This block will execute when the Flux completes (i.e., full response received)
            // You might need to collect the full response here if you want to save it after streaming
            // For now, let's assume the history saving will be handled by a separate mechanism
            // or that the OpenAIRequestAssembler handles it internally if it's a tool call.
            // If you need to save the full AI response here, you'd need to collect it first.
            // Example: aiResponseFlux.collectList().map(chunks -> String.join("", chunks)).subscribe(fullResponse -> {
            //     MCPChatHistory chatHistory = new MCPChatHistory();
            //     chatHistory.setChatBaseId(chatBaseId);
            //     chatHistory.setUserId(userId);
            //     chatHistory.setUserMessage(userMessage);
            //     chatHistory.setAiResponse(fullResponse);
            //     mcpChatHistoryService.createChatHistory(chatHistory);
            // });
        });
    }
}