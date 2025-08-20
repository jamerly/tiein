package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.MCPPrompt;
import ai.jamerly.tiein.repository.MCPPromptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MCPPromptService {

    @Autowired
    private MCPPromptRepository mcpPromptRepository;

    public Page<MCPPrompt> getAllPrompts(Pageable pageable) {
        return mcpPromptRepository.findAll(pageable);
    }

    public Optional<MCPPrompt> getPromptByName(String name) {
        return mcpPromptRepository.findByName(name);
    }

    public Optional<MCPPrompt> getPromptById(Long id) {
        return mcpPromptRepository.findById(id);
    }

    public MCPPrompt createPrompt(MCPPrompt prompt) {
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
                    return mcpPromptRepository.save(prompt);
                }).orElse(null);
    }

    public void deletePrompt(Long id) {
        mcpPromptRepository.deleteById(id);
    }

    public long countPrompts() {
        return mcpPromptRepository.count();
    }
}
