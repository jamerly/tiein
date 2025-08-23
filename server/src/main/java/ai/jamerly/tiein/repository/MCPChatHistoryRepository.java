package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.ChatHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MCPChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    Page<ChatHistory> findByChatBaseId(Long chatBaseId, Pageable pageable);
    List<ChatHistory> findByChatSessionId(UUID sessionId);

    Page<ChatHistory> findByChatSessionId(UUID sessionId, Pageable pageable);
}
