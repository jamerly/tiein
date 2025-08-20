package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.MCPResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MCPResourceRepository extends JpaRepository<MCPResource, Long> {
    Optional<MCPResource> findByUri(String uri);
    Page<MCPResource> findByGroupIdsJsonContaining(String groupId, Pageable pageable);
}