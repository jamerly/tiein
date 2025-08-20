package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.Group;
import ai.jamerly.tiein.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GroupService {

    private final GroupRepository groupRepository;

    @Autowired
    public GroupService(GroupRepository groupRepository) {
        this.groupRepository = groupRepository;
    }

    public Page<Group> findAllGroups(Pageable pageable) {
        return groupRepository.findAll(pageable);
    }

    public Optional<Group> findGroupById(Long id) {
        return groupRepository.findById(id);
    }

    public Group createGroup(Group group) {
        // Add any business logic/validation before saving
        return groupRepository.save(group);
    }

    public Group updateGroup(Long id, Group groupDetails) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id " + id));
        group.setName(groupDetails.getName());
        // Add any business logic/validation before saving
        return groupRepository.save(group);
    }

    public void deleteGroup(Long id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id " + id));
        groupRepository.delete(group);
    }
}
