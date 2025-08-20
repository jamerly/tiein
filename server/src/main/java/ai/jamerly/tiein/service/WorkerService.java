package ai.jamerly.tiein.service;

import ai.jamerly.tiein.dto.WorkerDto;
import ai.jamerly.tiein.entity.Worker;
import ai.jamerly.tiein.repository.WorkerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WorkerService {

    private final WorkerRepository workerRepository;
    private final SystemSettingService systemSettingService;
    private final WebClient webClient;

    public WorkerService(WorkerRepository workerRepository, SystemSettingService systemSettingService, WebClient.Builder webClientBuilder) {
        this.workerRepository = workerRepository;
        this.systemSettingService = systemSettingService;
        this.webClient = webClientBuilder.baseUrl("https://api.openai.com/v1").build();
    }

    public WorkerDto createWorker(WorkerDto workerDto) {
        Worker worker = new Worker();
        worker.setName(workerDto.getName());
        worker.setScript(workerDto.getScript());
        Worker savedWorker = workerRepository.save(worker);
        return convertToDto(savedWorker);
    }

    public Page<WorkerDto> getAllWorkers(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return workerRepository.findAll(pageRequest).map(this::convertToDto);
    }

    public Optional<WorkerDto> getWorkerById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return workerRepository.findById(id).map(this::convertToDto);
    }

    public WorkerDto updateWorker(Long id, WorkerDto workerDto) {
        Worker existingWorker = workerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Worker not found with id " + id));
        existingWorker.setName(workerDto.getName());
        existingWorker.setScript(workerDto.getScript());
        Worker updatedWorker = workerRepository.save(existingWorker);
        return convertToDto(updatedWorker);
    }

    public void deleteWorker(Long id) {
        workerRepository.deleteById(id);
    }

    public String generateScript(String prompt) {
        String openaiApiKey = systemSettingService.getOpenAIApiKey();
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            throw new RuntimeException("OpenAI API Key is not configured in System Settings.");
        }

        // Construct the request body for OpenAI Chat Completion API
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo", // Using a chat model
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a helpful assistant that generates Groovy scripts." +
                                " please generate the Groovy script base user's requirements   "),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.9,
                "max_tokens", 500
        );

        // Make the API call using WebClient
        String response = webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openaiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class) // Get raw JSON string response
                .block(); // Block to get the result synchronously (for simplicity in this example)

        // Parse the JSON response to extract the generated content
        // This is a simplified parsing. In a real app, use a JSON library like Jackson or Gson.
        try {
            // Find the content field in the response
            int contentStartIndex = response.indexOf("\"content\":\"") + "\"content\":\"".length();
            int contentEndIndex = response.indexOf("\"", contentStartIndex);
            String generatedText = response.substring(contentStartIndex, contentEndIndex);
            // Basic unescaping of common JSON escape sequences
            generatedText = generatedText.replace("\\n", "\n").replace("\\t", "\t").replace("\\\"", "\"");
            return generatedText;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response: " + e.getMessage() + ". Response: " + response, e);
        }
    }

    private WorkerDto convertToDto(Worker worker) {
        return new WorkerDto(worker.getId(), worker.getName(), worker.getScript());
    }
}