package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.MCPPrompt;
import ai.jamerly.tiein.repository.MCPPromptRepository;
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
public class MCPPromptService {

    @Autowired
    private MCPPromptRepository mcpPromptRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public Page<MCPPrompt> getAllPrompts(Pageable pageable, List<Long> groupIds) {
        List<MCPPrompt> allPrompts = mcpPromptRepository.findAll(); // Fetch all prompts
        List<MCPPrompt> filteredPrompts = new ArrayList<>();

        if (groupIds != null && !groupIds.isEmpty()) {
            Set<Long> filterGroupIdsSet = new HashSet<>(groupIds);
            for (MCPPrompt prompt : allPrompts) {
                if (prompt.getGroupIds() != null) {
                    // Check if any of the prompt's groupIds are in the filterGroupIdsSet
                    boolean matches = prompt.getGroupIds().stream().anyMatch(filterGroupIdsSet::contains);
                    if (matches) {
                        filteredPrompts.add(prompt);
                    }
                }
            }
        } else {
            filteredPrompts.addAll(allPrompts);
        }

        // Apply pagination manually after filtering
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredPrompts.size());
        List<MCPPrompt> pageContent = filteredPrompts.subList(start, end);

        return new PageImpl<>(pageContent, pageable, filteredPrompts.size());
    }

    public Optional<MCPPrompt> getPromptByName(String name) {
        return mcpPromptRepository.findByName(name);
    }

    public Optional<MCPPrompt> getPromptById(Long id) {
        return mcpPromptRepository.findById(id);
    }

    public MCPPrompt createPrompt(MCPPrompt prompt) {
        // groupIdsJson will be set by the entity's setGroupIds method
        return mcpPromptRepository.save(prompt);
    }

    public MCPPrompt updatePrompt(Long id, MCPPrompt updatedPrompt) {
        return mcpPromptRepository.findById(id)
                .map(prompt -> {
                    prompt.setName(updatedPrompt.getName());
                    prompt.setContent(updatedPrompt.getContent());
                    prompt.setDescription(updatedPrompt.getDescription());
                    prompt.setInputSchemaJson(updatedPrompt.getInputSchemaJson());
                    prompt.setOutputSchemaJson(updatedPrompt.getOutputSchemaJson());
                    prompt.setGroupIds(updatedPrompt.getGroupIds()); // Update groupIds
                    return mcpPromptRepository.save(prompt);
                }).orElse(null);
    }

    public void deletePrompt(Long id) {
        mcpPromptRepository.deleteById(id);
    }

    public long countPrompts() {
        return mcpPromptRepository.count();
    }

    public List<MCPPrompt> getPromptsByGroupId(Long groupId) {
        try {
            String groupIdJson = objectMapper.writeValueAsString(groupId);
            return mcpPromptRepository.findByGroupIdsJsonContaining(groupIdJson, Pageable.unpaged()).getContent();
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return List.of();
        }
    }
}
