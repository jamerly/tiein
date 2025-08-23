package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.ChatHistory;
import ai.jamerly.tiein.repository.MCPChatHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ChatHistoryService {

    @Autowired
    private MCPChatHistoryRepository mcpChatHistoryRepository;

    public Page<ChatHistory> getChatHistory(Pageable pageable) {
        return mcpChatHistoryRepository.findAll(pageable);
    }

    public Page<ChatHistory> getChatHistoryByChatBaseId(Long chatBaseId, Pageable pageable) {
        return mcpChatHistoryRepository.findByChatBaseId(chatBaseId, pageable);
    }

    public Page<ChatHistory> getChatHistoryBySessionId(UUID sessionId, Pageable pageable) {
        return mcpChatHistoryRepository.findByChatSessionId(sessionId,pageable);
    }
    public List<ChatHistory> queryBySessionId(UUID sessionId) {
        return mcpChatHistoryRepository.findByChatSessionId(sessionId);
    }

    public ChatHistory createChatHistory(ChatHistory chatHistory) {
        return mcpChatHistoryRepository.save(chatHistory);
    }
}
