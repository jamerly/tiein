package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.MCPChatHistory;
import ai.jamerly.tiein.repository.MCPChatHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MCPChatHistoryService {

    @Autowired
    private MCPChatHistoryRepository mcpChatHistoryRepository;

    public Page<MCPChatHistory> getChatHistory(Pageable pageable) {
        return mcpChatHistoryRepository.findAll(pageable);
    }

    public Page<MCPChatHistory> getChatHistoryByChatBaseId(Long chatBaseId, Pageable pageable) {
        return mcpChatHistoryRepository.findByChatBaseId(chatBaseId, pageable);
    }

    public List<MCPChatHistory> queryBySessionId(String sessionId) {
        return mcpChatHistoryRepository.findBySessionId(sessionId);
    }

    public MCPChatHistory createChatHistory(MCPChatHistory chatHistory) {
        return mcpChatHistoryRepository.save(chatHistory);
    }
}
