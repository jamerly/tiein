package ai.jamerly.tiein.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Data
@Entity
@Table(name = "mcp_tools")
public class MCPTool {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ToolType type;

    // For HTTP tools
    private String httpMethod;
    private String httpUrl;
    @Column(columnDefinition = "TEXT")
    private String httpHeaders;
    @Column(columnDefinition = "TEXT")
    private String httpBody;

    // For Groovy tools
    @Column(columnDefinition = "TEXT")
    private String groovyScript;

    private Long workerId; // New field to link to Worker entity

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String inputSchemaJson;

    @Column(columnDefinition = "TEXT")
    private String outputSchemaJson;

    @Column(columnDefinition = "TEXT")
    private String groupIdsJson; // Storing group IDs as a JSON string

    @Transient // This field will not be persisted in the database
    private List<Long> groupIds;

    @Transient
    private Worker worker; // New transient field for Worker

    // New field for proxy
    private Boolean isProxy; // Indicates if the tool requires proxy requests

    public enum ToolType {
        HTTP,
        GROOVY,
        INTERNAL
    }

    // Custom getter for groupIds to convert from JSON string
    public List<Long> getGroupIds() {
        if (this.groupIds == null && this.groupIdsJson != null) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                this.groupIds = Arrays.asList(objectMapper.readValue(this.groupIdsJson, Long[].class));
            } catch (JsonProcessingException e) {
                e.printStackTrace();
                this.groupIds = new ArrayList<>();
            }
        }
        return this.groupIds;
    }

    // Custom setter for groupIds to convert to JSON string
    public void setGroupIds(List<Long> groupIds) {
        this.groupIds = groupIds;
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            this.groupIdsJson = objectMapper.writeValueAsString(groupIds);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            this.groupIdsJson = "[]";
        }
    }
}
