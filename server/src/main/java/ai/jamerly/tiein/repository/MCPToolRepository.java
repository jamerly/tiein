package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.MCPTool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MCPToolRepository extends JpaRepository<MCPTool, Long> {
    Optional<MCPTool> findByName(String name);
    List<MCPTool> findByGroupId(Long groupId);
}
