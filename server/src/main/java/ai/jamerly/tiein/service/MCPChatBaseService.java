package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.MCPChatBase;
import ai.jamerly.tiein.entity.MCPChatHistory;
import ai.jamerly.tiein.repository.MCPChatBaseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
        // groupIdsJson will be set by the entity's setGroupIds method
        return mcpChatBaseRepository.save(chatBase);
    }

    public MCPChatBase updateChatBase(Long id, MCPChatBase chatBaseDetails) {
        return mcpChatBaseRepository.findById(id)
                .map(chatBase -> {
                    chatBase.setName(chatBaseDetails.getName());
                    chatBase.setRolePrompt(chatBaseDetails.getRolePrompt());
                    chatBase.setStatus(chatBaseDetails.getStatus());
                    chatBase.setGroupIds(chatBaseDetails.getGroupIds()); // This will update groupIdsJson internally
                    return mcpChatBaseRepository.save(chatBase);
                }).orElse(null);
    }

    public void deleteChatBase(Long id) {
        mcpChatBaseRepository.deleteById(id);
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

    public Flux<String> processChatMessage(Long chatBaseId, Long userId, String userMessage) {
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

        // Add role prompt as a system message
        Map<String, Object> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", chatBase.getRolePrompt());
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