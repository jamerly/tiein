package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.dto.PageerDto;
import ai.jamerly.tiein.entity.MCPTool;
import ai.jamerly.tiein.entity.SystemSetting;
import ai.jamerly.tiein.repository.UserRepository;
import ai.jamerly.tiein.service.MCPToolService;
import ai.jamerly.tiein.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/mcp-server")
public class MCPServerController {

    @Autowired
    private MCPToolService mcpToolService;

    @Autowired
    private SystemSettingService systemSettingService;

    @Autowired
    private UserRepository userRepository;

    @Value("${info.app.name:TieIn MCP Server}")
    private String appName;

    @Value("${info.app.version:0.0.1-SNAPSHOT}")
    private String appVersion;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("MCP Server is running."));
    }

    @PostMapping("/execute-by-name")
    public ResponseEntity<ApiResponse<String>> executeToolByName(@RequestParam String toolName) {
        Optional<MCPTool> toolOptional = mcpToolService.getToolByName(toolName);
        if (toolOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(404, "Tool not found: " + toolName));
        }

        try {
            ai.jamerly.tiein.dto.ToolExecutionResult result = mcpToolService.executeTool(toolOptional.get().getId(), null);
            if (result.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(result.getOutput()));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(500, result.getErrorMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(500, "Error executing tool: " + e.getMessage()));
        }
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, String>>> getServerInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("appName", appName);
        info.put("appVersion", appVersion);
        info.put("uptime", formatUptime(ManagementFactory.getRuntimeMXBean().getUptime()));
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    @GetMapping("/tools/all")
    public ResponseEntity<ApiResponse<Page<MCPTool>>> getAllTools(@RequestParam PageerDto pageerDto) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        mcpToolService.getAllTools(
                                PageRequest.of(
                                        pageerDto.getPage(),
                                        pageerDto.getPageSize(),
                                        Sort.by("id").descending()
                                )
                        )
                )
        );
    }

    @GetMapping("/settings/all")
    public ResponseEntity<ApiResponse<List<SystemSetting>>> getAllSystemSettings() {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.getAllSystemSettings()));
    }

    @GetMapping("/status/initialized")
    public ResponseEntity<ApiResponse<Boolean>> getSystemInitializedStatus() {
        return ResponseEntity.ok(ApiResponse.success(userRepository.count() > 0));
    }

    private String formatUptime(long millis) {
        long days = millis / (1000 * 60 * 60 * 24);
        millis %= (1000 * 60 * 60 * 24);
        long hours = millis / (1000 * 60 * 60);
        millis %= (1000 * 60 * 60);
        long minutes = millis / (1000 * 60);
        millis %= (1000 * 60);
        long seconds = millis / 1000;
        return String.format("%d days, %d hours, %d minutes, %d seconds", days, hours, minutes, seconds);
    }
}