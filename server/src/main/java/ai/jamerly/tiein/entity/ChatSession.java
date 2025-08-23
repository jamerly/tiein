package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "chatbase_session")
public class ChatSession {

    @Id
    private UUID id;

    @Column(nullable = true, length = 255)
    private String title;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Date startTime;

    @Column(nullable = true, length = 255)
    private String userId;

    private Long chatBaseId;
}
