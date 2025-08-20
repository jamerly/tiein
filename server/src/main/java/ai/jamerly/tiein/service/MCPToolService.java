package ai.jamerly.tiein.service;

import ai.jamerly.tiein.dto.ToolExecutionResult;
import ai.jamerly.tiein.entity.MCPTool;
import ai.jamerly.tiein.repository.MCPToolRepository;
import com.alibaba.fastjson2.JSONObject;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MCPToolService {

    @Autowired
    private MCPToolRepository mcpToolRepository;

    @Autowired // Inject GroupRepository
    private GroupRepository groupRepository;

    @Autowired
    private WorkerService workerService; // Inject WorkerService

    private final ObjectMapper objectMapper = new ObjectMapper();

    // CRUD Operations
    public Page<MCPTool> getAllTools(Pageable pageable) {
        Page<MCPTool> mcpTools = mcpToolRepository.findAll(pageable);
        mcpTools.getContent().forEach(t -> {
            t.setGroup(
                    groupRepository.findById(t.getGroupId()).orElse(null)
            );
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
            if (tool.getGroupId() != null) {
                tool.setGroup(groupRepository.findById(tool.getGroupId()).orElse(null));
            }
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
        return mcpToolRepository.findByGroupId(groupId);
    }

    @Transactional
    public MCPTool createTool(MCPTool tool) {
        if (tool.getGroupId() != null) {
            Group group = groupRepository.findById(tool.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with ID: " + tool.getGroupId()));
            tool.setGroupId(group.getId());
        } else {
            tool.setGroupId(null); // Ensure no group is set if groupId is null
        }
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
                    tool.setGroupId(updatedTool.getGroupId());
                    tool.setGroovyScript(updatedTool.getGroovyScript());
                    tool.setDescription(updatedTool.getDescription());
                    tool.setInputSchemaJson(updatedTool.getInputSchemaJson());
                    tool.setOutputSchemaJson(updatedTool.getOutputSchemaJson());
                    tool.setIsProxy(updatedTool.getIsProxy()); // Copy isProxy field
                    tool.setWorkerId(updatedTool.getWorkerId()); // Set workerId
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
                    result.setErrorMessage("Unsupported HTTP method: " + tool.getHttpMethod());
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
            Binding binding = new Binding();
            if (arguments != null) {
                arguments.forEach(binding::setVariable);
            }

            GroovyShell shell = new GroovyShell(binding);
            Object scriptResult = shell.evaluate(tool.getGroovyScript());
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
}