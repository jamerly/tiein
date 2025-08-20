package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
import ai.jamerly.tiein.entity.Group; // Import Group
import ai.jamerly.tiein.entity.Worker; // Import Worker
import lombok.Data;

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
    // Transient fields to match frontend DTO, will not be persisted
    private Long groupId;

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

    @Transient
    private Group group;

    @Transient
    private Worker worker; // New transient field for Worker

    // New field for proxy
    private Boolean isProxy; // Indicates if the tool requires proxy requests

    public enum ToolType {
        HTTP,
        GROOVY
    }
}