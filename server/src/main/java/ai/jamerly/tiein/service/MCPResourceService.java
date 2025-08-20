package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.MCPResource;
import ai.jamerly.tiein.repository.MCPResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MCPResourceService {

    @Autowired
    private MCPResourceRepository mcpResourceRepository;

    public Page<MCPResource> getAllResources(Pageable pageable) {
        return mcpResourceRepository.findAll(pageable);
    }

    public Optional<MCPResource> getResourceByUri(String uri) {
        return mcpResourceRepository.findByUri(uri);
    }

    public Optional<MCPResource> getResourceById(Long id) {
        return mcpResourceRepository.findById(id);
    }

    public MCPResource createResource(MCPResource resource) {
        return mcpResourceRepository.save(resource);
    }

    public MCPResource updateResource(Long id, MCPResource updatedResource) {
        return mcpResourceRepository.findById(id)
                .map(resource -> {
                    resource.setUri(updatedResource.getUri());
                    resource.setContent(updatedResource.getContent());
                    resource.setContentType(updatedResource.getContentType());
                    resource.setDescription(updatedResource.getDescription());
                    return mcpResourceRepository.save(resource);
                }).orElse(null);
    }

    public void deleteResource(Long id) {
        mcpResourceRepository.deleteById(id);
    }

    public long countResources() {
        return mcpResourceRepository.count();
    }
}
