package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "mcp_resources")
public class MCPResource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String uri;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String contentType;

    private String description;
}
