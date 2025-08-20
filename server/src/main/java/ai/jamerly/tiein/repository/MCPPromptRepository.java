package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.MCPPrompt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MCPPromptRepository extends JpaRepository<MCPPrompt, Long> {
    Optional<MCPPrompt> findByName(String name);
    Page<MCPPrompt> findByGroupIdsJsonContaining(String groupId, Pageable pageable);
}