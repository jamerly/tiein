package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.KeyRequest;
import ai.jamerly.tiein.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/settings")
public class SystemSettingController {

    @Autowired
    private SystemSettingService systemSettingService;

    @GetMapping("/registration/status")
    public ResponseEntity<ApiResponse<Boolean>> getRegistrationStatus() {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.isRegistrationOpen()));
    }

    @PostMapping("/registration/set")
    public ResponseEntity<ApiResponse<String>> setRegistrationStatus(@RequestParam boolean open) {
        systemSettingService.setRegistrationOpen(open);
        return ResponseEntity.ok(ApiResponse.success("Registration status updated successfully."));
    }

    @GetMapping("/openai/key")
    public ResponseEntity<ApiResponse<String>> getOpenAIApiKey() {
        String apiKey = systemSettingService.getOpenAIApiKey();
        return ResponseEntity.ok(ApiResponse.success(apiKey));
    }

    @PostMapping("/openai/key")
    public ResponseEntity<ApiResponse<String>> setOpenAIApiKey(@RequestBody KeyRequest keyRequest) {
        systemSettingService.setOpenAIApiKey(keyRequest.getKey());
        return ResponseEntity.ok(ApiResponse.success("OpenAI API Key updated successfully."));
    }

    @DeleteMapping("/openai/key")
    public ResponseEntity<ApiResponse<String>> deleteOpenApiKey(){
        systemSettingService.deleteOpenAIApiKey();
        return ResponseEntity.ok(ApiResponse.success("OpenAI API Key deleted successfully."));

    }
}