package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
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

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String inputSchemaJson;

    @Column(columnDefinition = "TEXT")
    private String outputSchemaJson;

    // New field for proxy
    private Boolean isProxy; // Indicates if the tool requires proxy requests

    public enum ToolType {
        HTTP,
        GROOVY
    }
}