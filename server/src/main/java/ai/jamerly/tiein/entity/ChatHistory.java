package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "chatbase_history")
public class ChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long chatBaseId;

    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    private String outerUserId;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String userMessage;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String aiResponse;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Date timestamp;

    @Column(nullable = false, updatable = false)
    private UUID chatSessionId;
}
