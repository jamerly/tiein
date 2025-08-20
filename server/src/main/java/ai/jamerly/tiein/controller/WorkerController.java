package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.WorkerDto;
import ai.jamerly.tiein.service.WorkerService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mcp/workers")
public class WorkerController {

    private final WorkerService workerService;

    public WorkerController(WorkerService workerService) {
        this.workerService = workerService;
    }

    @PostMapping
    public ResponseEntity<WorkerDto> createWorker(@RequestBody WorkerDto workerDto) {
        WorkerDto createdWorker = workerService.createWorker(workerDto);
        return new ResponseEntity<>(createdWorker, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WorkerDto>>> getAllWorkers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<WorkerDto> workers = workerService.getAllWorkers(page, size);
        return ResponseEntity.ok(ApiResponse.success(workers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkerDto> getWorkerById(@PathVariable Long id) {
        return workerService.getWorkerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkerDto> updateWorker(@PathVariable Long id, @RequestBody WorkerDto workerDto) {
        try {
            WorkerDto updatedWorker = workerService.updateWorker(id, workerDto);
            return ResponseEntity.ok(updatedWorker);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorker(@PathVariable Long id) {
        workerService.deleteWorker(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate-script")
    public ResponseEntity<String> generateScript(@RequestBody String prompt) {
        try {
            String generatedScript = workerService.generateScript(prompt);
            return ResponseEntity.ok(generatedScript);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to generate script: " + e.getMessage());
        }
    }
}