package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.MCPResource;
import ai.jamerly.tiein.repository.MCPResourceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MCPResourceService {

    @Autowired
    private MCPResourceRepository mcpResourceRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public Page<MCPResource> getAllResources(Pageable pageable, List<Long> groupIds) {
        List<MCPResource> allResources = mcpResourceRepository.findAll(); // Fetch all resources
        List<MCPResource> filteredResources = new ArrayList<>();

        if (groupIds != null && !groupIds.isEmpty()) {
            Set<Long> filterGroupIdsSet = new HashSet<>(groupIds);
            for (MCPResource resource : allResources) {
                if (resource.getGroupIds() != null) {
                    // Check if any of the resource's groupIds are in the filterGroupIdsSet
                    boolean matches = resource.getGroupIds().stream().anyMatch(filterGroupIdsSet::contains);
                    if (matches) {
                        filteredResources.add(resource);
                    }
                }
            }
        } else {
            filteredResources.addAll(allResources);
        }

        // Apply pagination manually after filtering
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredResources.size());
        List<MCPResource> pageContent = filteredResources.subList(start, end);

        return new PageImpl<>(pageContent, pageable, filteredResources.size());
    }

    public Optional<MCPResource> getResourceByUri(String uri) {
        return mcpResourceRepository.findByUri(uri);
    }

    public Optional<MCPResource> getResourceById(Long id) {
        return mcpResourceRepository.findById(id);
    }

    public MCPResource createResource(MCPResource resource) {
        // groupIdsJson will be set by the entity's setGroupIds method
        return mcpResourceRepository.save(resource);
    }

    public MCPResource updateResource(Long id, MCPResource updatedResource) {
        return mcpResourceRepository.findById(id)
                .map(resource -> {
                    resource.setUri(updatedResource.getUri());
                    resource.setContent(updatedResource.getContent());
                    resource.setContentType(updatedResource.getContentType());
                    resource.setDescription(updatedResource.getDescription());
                    resource.setGroupIds(updatedResource.getGroupIds()); // Update groupIds
                    return mcpResourceRepository.save(resource);
                }).orElse(null);
    }

    public void deleteResource(Long id) {
        mcpResourceRepository.deleteById(id);
    }

    public long countResources() {
        return mcpResourceRepository.count();
    }

    public List<MCPResource> getResourcesByGroupId(Long groupId) {
        try {
            String groupIdJson = objectMapper.writeValueAsString(groupId);
            return mcpResourceRepository.findByGroupIdsJsonContaining(groupIdJson, Pageable.unpaged()).getContent();
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return List.of();
        }
    }
}
