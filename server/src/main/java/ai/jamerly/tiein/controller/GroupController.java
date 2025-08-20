package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.GroupDTO;
import ai.jamerly.tiein.entity.Group;
import ai.jamerly.tiein.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ai.jamerly.tiein.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/mcp/groups")
public class GroupController {

    private final GroupService groupService;

    @Autowired
    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GroupDTO>>> getAllGroups(Pageable pageable) {
        Page<Group> groupsPage = groupService.findAllGroups(pageable);
        List<GroupDTO> groupDTOs = groupsPage.getContent().stream()
                .map(group -> new GroupDTO(group.getId(), group.getName()))
                .collect(Collectors.toList());
        Page<GroupDTO> groupDTOPage = new PageImpl<>(groupDTOs, pageable, groupsPage.getTotalElements());
        return ResponseEntity.ok(ApiResponse.success(groupDTOPage));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDTO> getGroupById(@PathVariable Long id) {
        return groupService.findGroupById(id)
                .map(group -> new GroupDTO(group.getId(), group.getName()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<GroupDTO> createGroup(@RequestBody GroupDTO groupDTO) {
        Group group = new Group(groupDTO.getName());
        Group createdGroup = groupService.createGroup(group);
        return new ResponseEntity<>(new GroupDTO(createdGroup.getId(), createdGroup.getName()), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupDTO> updateGroup(@PathVariable Long id, @RequestBody GroupDTO groupDTO) {
        Group groupDetails = new Group(groupDTO.getName());
        Group updatedGroup = groupService.updateGroup(id, groupDetails);
        return ResponseEntity.ok(new GroupDTO(updatedGroup.getId(), updatedGroup.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
