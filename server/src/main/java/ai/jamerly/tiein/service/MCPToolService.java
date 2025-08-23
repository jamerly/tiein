package ai.jamerly.tiein.service;

import ai.jamerly.tiein.dto.ToolExecutionResult;
import ai.jamerly.tiein.entity.MCPResource;
import ai.jamerly.tiein.entity.MCPTool;
import ai.jamerly.tiein.repository.MCPToolRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import groovy.lang.Binding;
import groovy.lang.GroovyShell;
import org.apache.hc.client5.http.classic.methods.*;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ClassicHttpRequest;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import ai.jamerly.tiein.entity.Group; // Import Group
import ai.jamerly.tiein.repository.GroupRepository; // Import GroupRepository
import ai.jamerly.tiein.service.WorkerService; // Import WorkerService
import ai.jamerly.tiein.service.MCPResourceService; // Import MCPResourceService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class MCPToolService {

    @Autowired
    private MCPToolRepository mcpToolRepository;

    @Autowired // Inject GroupRepository
    private GroupRepository groupRepository;

    @Autowired
    private WorkerService workerService; // Inject WorkerService

    @Autowired
    private MCPResourceService mcpResourceService; // Inject MCPResourceService

    private final ObjectMapper objectMapper = new ObjectMapper();

    // CRUD Operations
    public Page<MCPTool> getAllTools(Pageable pageable, List<Long> groupIds) {
        List<MCPTool> allTools = mcpToolRepository.findAll(); // Fetch all tools
        List<MCPTool> filteredTools = new ArrayList<>();

        if (groupIds != null && !groupIds.isEmpty()) {
            Set<Long> filterGroupIdsSet = new HashSet<>(groupIds);
            for (MCPTool tool : allTools) {
                if (tool.getGroupIds() != null) {
                    // Check if any of the tool's groupIds are in the filterGroupIdsSet
                    boolean matches = tool.getGroupIds().stream().anyMatch(filterGroupIdsSet::contains);
                    if (matches) {
                        filteredTools.add(tool);
                    }
                }
            }
        } else {
            filteredTools.addAll(allTools);
        }

        // Apply pagination manually after filtering
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredTools.size());
        List<MCPTool> pageContent = filteredTools.subList(start, end);

        Page<MCPTool> mcpTools = new PageImpl<>(pageContent, pageable, filteredTools.size());

        mcpTools.getContent().forEach(t -> {
            log.info("Processing tool: {} with workerId: {}", t.getName(), t.getWorkerId());
            log.info("Tool {} groupIds: {}", t.getName(), t.getGroupIds());
            if (t.getWorkerId() != null) {
                workerService.getWorkerById(t.getWorkerId()).ifPresent(workerDto -> {
                    ai.jamerly.tiein.entity.Worker workerEntity = new ai.jamerly.tiein.entity.Worker();
                    workerEntity.setId(workerDto.getId());
                    workerEntity.setName(workerDto.getName());
                    workerEntity.setScript(workerDto.getScript());
                    t.setWorker(workerEntity);
                });
            }
        });
        return mcpTools;
    }

    public Optional<MCPTool> getToolById(Long id) {
        Optional<MCPTool> toolOptional = mcpToolRepository.findById(id);
        toolOptional.ifPresent(tool -> {
            if (tool.getWorkerId() != null) {
                workerService.getWorkerById(tool.getWorkerId()).ifPresent(workerDto -> {
                    ai.jamerly.tiein.entity.Worker workerEntity = new ai.jamerly.tiein.entity.Worker();
                    workerEntity.setId(workerDto.getId());
                    workerEntity.setName(workerDto.getName());
                    workerEntity.setScript(workerDto.getScript());
                    tool.setWorker(workerEntity);
                });
            }
        });
        return toolOptional;
    }

    public Optional<MCPTool> getToolByName(String name) {
        return mcpToolRepository.findByName(name);
    }

    public List<MCPTool> getToolsByGroupId(Long groupId) {
        try {
            String groupIdJson = objectMapper.writeValueAsString(groupId);
            return mcpToolRepository.findByGroupIdsJsonContaining(groupIdJson);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return List.of();
        }
    }

    @Transactional
    public MCPTool createTool(MCPTool tool) {
        // groupIdsJson will be set by the entity's setGroupIds method
        tool.setWorkerId(tool.getWorkerId()); // Set workerId
        return mcpToolRepository.save(tool);
    }

    @Transactional
    public MCPTool updateTool(Long id, MCPTool updatedTool) {
        return mcpToolRepository.findById(id)
                .map(tool -> {
                    tool.setName(updatedTool.getName());
                    tool.setType(updatedTool.getType());
                    tool.setHttpMethod(updatedTool.getHttpMethod());
                    tool.setHttpUrl(updatedTool.getHttpUrl());
                    tool.setHttpHeaders(updatedTool.getHttpHeaders());
                    tool.setHttpBody(updatedTool.getHttpBody());
                    tool.setGroovyScript(updatedTool.getGroovyScript());
                    tool.setDescription(updatedTool.getDescription());
                    tool.setInputSchemaJson(updatedTool.getInputSchemaJson());
                    tool.setOutputSchemaJson(updatedTool.getOutputSchemaJson());
                    tool.setIsProxy(updatedTool.getIsProxy()); // Copy isProxy field
                    tool.setWorkerId(updatedTool.getWorkerId()); // Set workerId
                    tool.setGroupIds(updatedTool.getGroupIds()); // Update groupIds
                    return mcpToolRepository.save(tool);
                }).orElse(null);
    }

    public void deleteTool(Long id) {
        mcpToolRepository.deleteById(id);
    }

    public long countTools() {
        return mcpToolRepository.count();
    }

    // Tool Execution
    public ToolExecutionResult executeTool(Long id, Map<String, Object> arguments) {
        Optional<MCPTool> toolOptional = mcpToolRepository.findById(id);
        if (toolOptional.isEmpty()) {
            ToolExecutionResult result = new ToolExecutionResult();
            result.setSuccess(false);
            result.setErrorMessage("Tool not found.");
            return result;
        }

        MCPTool tool = toolOptional.get();

        try {
            switch (tool.getType()) {
                case HTTP:
                    return executeHttpTool(tool, arguments);
                case GROOVY:
                    return executeGroovyTool(tool, arguments);
                case INTERNAL:
                    if ("get_resource_content".equals(tool.getName())) {
                        return executeGetResourceContentTool(arguments);
                    } else {
                        ToolExecutionResult result = new ToolExecutionResult();
                        result.setSuccess(false);
                        result.setErrorMessage("Unknown internal tool.");
                        return result;
                    }
                default:
                    ToolExecutionResult result = new ToolExecutionResult();
                    result.setSuccess(false);
                    result.setErrorMessage("Unknown tool type.");
                    return result;
            }
        } catch (Exception e) {
            ToolExecutionResult result = new ToolExecutionResult();
            result.setSuccess(false);
            result.setErrorMessage("Tool execution failed: " + e.getMessage());
            return result;
        }
    }

    private ToolExecutionResult executeHttpTool(MCPTool tool, Map<String, Object> arguments) throws IOException {
        ToolExecutionResult result = new ToolExecutionResult();
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            ClassicHttpRequest request;

            // TODO: Implement logic to use 'arguments' to dynamically construct URL, headers, or body
            // For example, arguments could be used for path variables, query parameters, or to populate a JSON body.
            // This would require a more detailed specification of how arguments map to HTTP request parts.

            String url = tool.getHttpUrl();
            // Example: if arguments contain a 'path_param', replace it in the URL
            // if (arguments != null && arguments.containsKey("path_param")) {
            //     url = url.replace("{path_param}", arguments.get("path_param").toString());
            // }

            switch (tool.getHttpMethod().toUpperCase()) {
                case "GET":
                    request = new HttpGet(url);
                    break;
                case "POST":
                    HttpPost httpPost = new HttpPost(url);
                    if (tool.getHttpBody() != null && !tool.getHttpBody().isEmpty()) {
                        httpPost.setEntity(new StringEntity(tool.getHttpBody(), ContentType.APPLICATION_JSON));
                    }
                    // TODO: If arguments should be part of the POST body, merge them here
                    request = httpPost;
                    break;
                case "PUT":
                    HttpPut httpPut = new HttpPut(url);
                    if (tool.getHttpBody() != null && !tool.getHttpBody().isEmpty()) {
                        httpPut.setEntity(new StringEntity(tool.getHttpBody(), ContentType.APPLICATION_JSON));
                    }
                    // TODO: If arguments should be part of the PUT body, merge them here
                    request = httpPut;
                    break;
                case "DELETE":
                    request = new HttpDelete(url);
                    break;
                default:
                    result.setSuccess(false);
                    result.setErrorMessage("Unsupported HTTP method.");
                    return result;
            }

            if (tool.getHttpHeaders() != null && !tool.getHttpHeaders().isEmpty()) {
                Map<String, String> headers = objectMapper.readValue(tool.getHttpHeaders(), new TypeReference<Map<String, String>>() {});
                headers.forEach(request::setHeader);
            }

            String responseBody = httpClient.execute(request, response -> {
                if (response.getEntity() != null) {
                    return new String(response.getEntity().getContent().readAllBytes());
                } else {
                    return "";
                }
            });
            result.setSuccess(true);
            result.setOutput(responseBody);
            return result;
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("HTTP Tool execution failed: " + e.getMessage());
            return result;
        }
    }

    private ToolExecutionResult executeGroovyTool(MCPTool tool, Map<String, Object> arguments) {
        ToolExecutionResult result = new ToolExecutionResult();
        try {
            if (tool.getWorkerId() == null) {
                result.setSuccess(false);
                result.setErrorMessage("Groovy Tool is not associated with a worker.");
                return result;
            }

            Optional<ai.jamerly.tiein.dto.WorkerDto> workerDtoOptional = workerService.getWorkerById(tool.getWorkerId());
            if (workerDtoOptional.isEmpty()) {
                result.setSuccess(false);
                result.setErrorMessage("Worker not found for the given workerId.");
                return result;
            }

            String script = workerDtoOptional.get().getScript();
            if (script == null || script.isEmpty()) {
                result.setSuccess(false);
                result.setErrorMessage("Groovy script is empty for the associated worker.");
                return result;
            }

            Binding binding = new Binding();
            if (arguments != null) {
                arguments.forEach(binding::setVariable);
            }
            GroovyShell shell = new GroovyShell(binding);
            Object scriptResult = shell.evaluate(script);
            result.setSuccess(true);
            result.setOutput(scriptResult != null ? scriptResult.toString() : "Groovy script executed successfully (no return value).");
            return result;
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Groovy Tool execution failed: " + e.getMessage());
            return result;
        }
    }

    public String callTool(Long toolId, Map<String, Object> parameters){
        ToolExecutionResult result = executeTool(toolId, parameters);
        if (result.isSuccess()) {
            return result.getOutput();
        } else {
            return "Error: " + result.getErrorMessage();
        }
    }

    private ToolExecutionResult executeGetResourceContentTool(Map<String, Object> arguments) {
        ToolExecutionResult result = new ToolExecutionResult();
        if (arguments == null || !arguments.containsKey("resource_uri")) {
            result.setSuccess(false);
            result.setErrorMessage("Missing 'resource_uri' argument for get_resource_content tool.");
            return result;
        }

        String resourceName = (String) arguments.get("resource_name");
        Optional<MCPResource> resourceOptional = mcpResourceService.getResourceByUri(resourceName);

        if (resourceOptional.isPresent()) {
            result.setSuccess(true);
            result.setOutput(resourceOptional.get().getContent());
        } else {
            result.setSuccess(false);
            result.setErrorMessage("Resource not found with name: " + resourceName);
        }
        return result;
    }
}