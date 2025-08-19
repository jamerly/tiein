package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "mcp_prompts")
public class MCPPrompt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String inputSchemaJson;

    @Column(columnDefinition = "TEXT")
    private String outputSchemaJson;
}
