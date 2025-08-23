package ai.jamerly.tiein.service;

import ai.jamerly.tiein.dto.InitResult;
import ai.jamerly.tiein.entity.ChatHistory;
import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.entity.ChatSession; // Added
import ai.jamerly.tiein.repository.MCPChatBaseRepository;
import com.alibaba.fastjson2.JSONObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.internal.StringUtil;
import org.slf4j.Logger; // Added
import org.slf4j.LoggerFactory; // Added
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatBaseService {

    private static final Logger logger = LoggerFactory.getLogger(ChatBaseService.class);

    @Autowired
    private MCPChatBaseRepository mcpChatBaseRepository;
    @Autowired
    private ChatHistoryService mcpChatHistoryService; // Changed from ChatHistoryService

    @Autowired
    private ChatSessionService chatSessionService; // Added

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

        String prompt = String.format("Given the user profile %s.\n " +
                "Write a friendly welcoming greeting in %s for \"%s\" and provide the result in JSON format. " +
                "```{\"greeting\" : \"generated greeting\"  }```", userProfileJson, language, chatBase.getGreeting());
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

    // Modified processChatMessage method
    public Flux<String> processChatMessage(Long chatBaseId, UUID sessionId, String externalUserId, String userMessage, String userProfileJson) {
        Optional<MCPChatBase> chatBaseOptional = mcpChatBaseRepository.findById(chatBaseId);
        if (chatBaseOptional.isEmpty()) {
            return Flux.just("Error: ChatBase not found.");
        }
        MCPChatBase chatBase = chatBaseOptional.get();

        ChatSession chatSession = chatSessionService.getOrCreateSession(sessionId,chatBaseId,externalUserId);

        AIRequest aiRequest = new AIRequest();
        aiRequest.setPrompt(userMessage);
        aiRequest.setModel("gpt-3.5-turbo"); // Or another appropriate model
        aiRequest.setStream(Boolean.TRUE); // Set to TRUE for streaming

        List<Map<String, Object>> historicalMessages = new ArrayList<>();

        if(!StringUtil.isBlank(userProfileJson)){
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "Visitor Profile is : " + userProfileJson);
            historicalMessages.add(systemMessage);
        }
        // Add role prompt as a system message
        Map<String, Object> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        String systemContent = chatBase.getRolePrompt();
        systemMessage.put("content", systemContent);
        historicalMessages.add(systemMessage);
        // Use MCPChatHistoryService and chatSession.getId()
        List<ChatHistory> chatHistories = mcpChatHistoryService.queryBySessionId(chatSession.getId());
        for( int i=0;i<chatHistories.size();i++){
            Map<String, Object> userMessageMap = new HashMap<>();
            userMessageMap.put("role", "user");
            userMessageMap.put("content", chatHistories.get(i).getUserMessage());
            historicalMessages.add(userMessageMap);
            Map<String, Object> assistantMessageMap = new HashMap<>();
            assistantMessageMap.put("role", "assistant");
            assistantMessageMap.put("content", chatHistories.get(i).getAiResponse());
            historicalMessages.add(assistantMessageMap);
        }
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
            StringBuffer serverResponse = new StringBuffer();
            aiResponseFlux.collectList().map(chunks -> {
                for( int i = 0; i< chunks.size();i++){
                    if( !"[DONE]".equals( chunks.get(i)) ) {
                        JSONObject jsonObject = JSONObject.parseObject(chunks.get(i));
                        serverResponse.append(jsonObject.getString("chunk"));
                    }
                }
                return String.join("", chunks);
            }).subscribe(fullResponse -> {
                ChatHistory chatHistory = new ChatHistory(); // Changed from ChatHistory
                chatHistory.setChatBaseId(chatBaseId);
                chatHistory.setOuterUserId(externalUserId); // Using externalUserId
                chatHistory.setUserMessage(userMessage);
                chatHistory.setChatSessionId(chatSession.getId()); // Set ChatSession
                String message = serverResponse.toString();
                chatHistory.setAiResponse(message);
                mcpChatHistoryService.createChatHistory(chatHistory); // Changed from chatHistoryService
            });
        });
    }
}