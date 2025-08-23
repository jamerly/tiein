package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    Optional<ChatSession> findByIdAndUserId(UUID id,String userId);
    Page<ChatSession> findByChatBaseId(Long baseId,Pageable pageable);
}
