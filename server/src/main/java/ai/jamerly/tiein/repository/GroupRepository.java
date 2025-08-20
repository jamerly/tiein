package ai.jamerly.tiein.repository;

import ai.jamerly.tiein.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    // Custom queries can be added here if needed
}
