package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.MCPChatHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MCPChatHistoryRepository extends JpaRepository<MCPChatHistory, Long> {
    Page<MCPChatHistory> findByChatBaseId(Long chatBaseId, Pageable pageable);
}
