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

    @Column(columnDefinition = "TEXT")
    private String groupIdsJson; // Storing group IDs as a JSON string

    @Transient // This field will not be persisted in the database
    private List<Long> groupIds;

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