package ai.jamerly.tiein.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tiein_groups") // "group" is a reserved keyword in some databases, so using "groups"
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // Constructors
    public Group() {
    }

    public Group(String name) {
        this.name = name;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "Group{" +
               "id=" + id +
               ", name='" + name + "'" +
               "}";
    }
}
