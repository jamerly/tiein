package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "mcp_chat_history")
public class MCPChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long chatBaseId;

    @Column(nullable = false)
    private Long userId; // Assuming a user ID is associated with the chat

    @Column(nullable = false, columnDefinition = "TEXT")
    private String userMessage;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String aiResponse;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Optional: Add a relationship to MCPChatBase if needed for more complex queries
    // @ManyToOne
    // @JoinColumn(name = "chatBaseId", insertable = false, updatable = false)
    // private MCPChatBase chatBase;
}
