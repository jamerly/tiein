package ai.jamerly.tiein.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

@Data
@Entity
@Table(name = "mcp_chatbase")
public class MCPChatBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String rolePrompt;

    @Column(columnDefinition = "TEXT")
    private String greeting;

    @Column(length = 64, unique = true)
    private String appId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE; // Default status

    @Column(nullable = false, columnDefinition = "TEXT")
    private String groupIdsJson; // Storing group IDs as a JSON string

    @Transient // This field will not be persisted in the database
    private List<Long> groupIds;

    @Column(nullable = false)
    private Boolean requireAuth = Boolean.FALSE; // default to false

    @Column
    private String authUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum Status {
        ACTIVE,
        INACTIVE
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