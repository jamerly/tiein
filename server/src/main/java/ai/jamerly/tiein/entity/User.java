package ai.jamerly.tiein.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID; // Import UUID for token generation

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String username;
    private String password;
    private String role; // e.g., "ADMIN", "USER"

    @Column(unique = true) // Ensure permanentToken is unique
    private String permanentToken;

    // Method to generate a new permanent token
    public void generateNewPermanentToken() {
        this.permanentToken = UUID.randomUUID().toString().replace("-", ""); // Simple UUID-based token
    }
}