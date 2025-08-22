package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.MCPChatBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MCPChatBaseRepository extends JpaRepository<MCPChatBase, Long> {
    Optional<MCPChatBase> findByAppId(String appId);
}
