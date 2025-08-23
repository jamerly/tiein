package ai.jamerly.tiein.dto;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String role;
}
