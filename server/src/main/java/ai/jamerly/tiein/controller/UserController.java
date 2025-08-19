package ai.jamerly.tiein.controller;

import ai.jamerly.tiein.dto.ChangePasswordRequest;
import ai.jamerly.tiein.dto.LoginRequest;
import ai.jamerly.tiein.dto.ApiResponse;
import ai.jamerly.tiein.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(@RequestBody LoginRequest loginRequest) {
        String token = userService.login(loginRequest.getUsername(), loginRequest.getPassword());
        if (token != null) {
            return ResponseEntity.ok(ApiResponse.success(token));
        } else {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "Invalid credentials"));
        }
    }

    @PostMapping("/changePassword")
    public ResponseEntity<ApiResponse<String>> changePassword(@RequestBody ChangePasswordRequest changePasswordRequest) {
        boolean success = userService.changePassword(
                changePasswordRequest.getUsername(),
                changePasswordRequest.getOldPassword(),
                changePasswordRequest.getNewPassword()
        );
        if (success) {
            return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
        } else {
            return ResponseEntity.status(400).body(ApiResponse.error(400, "Failed to change password"));
        }
    }

    // Optional: User registration endpoint
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@RequestBody LoginRequest registerRequest) {
        if (userService.register(registerRequest.getUsername(), registerRequest.getPassword()) != null) {
            return ResponseEntity.ok(ApiResponse.success("User registered successfully"));
        } else {
            return ResponseEntity.status(409).body(ApiResponse.error(409, "User already exists"));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getUserCount() {
        long count = userService.countUsers();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<ai.jamerly.tiein.entity.User>>> getAllUsers() {
        java.util.List<ai.jamerly.tiein.entity.User> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ai.jamerly.tiein.entity.User>> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(ApiResponse.success(user)))
                .orElse(ResponseEntity.status(404).body(ApiResponse.error(404, "User not found")));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ai.jamerly.tiein.entity.User>> createUser(@RequestBody ai.jamerly.tiein.entity.User user) {
        ai.jamerly.tiein.entity.User createdUser = userService.createUser(user);
        return ResponseEntity.status(201).body(ApiResponse.success(createdUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ai.jamerly.tiein.entity.User>> updateUser(@PathVariable Long id, @RequestBody ai.jamerly.tiein.entity.User user) {
        ai.jamerly.tiein.entity.User updatedUser = userService.updateUser(id, user);
        if (updatedUser != null) {
            return ResponseEntity.ok(ApiResponse.success(updatedUser));
        } else {
            return ResponseEntity.status(404).body(ApiResponse.error(404, "User not found"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }

    @GetMapping("/permanent-token")
    public ResponseEntity<ApiResponse<String>> getPermanentToken() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String token = userService.getPermanentTokenForUser(username);
        if (token != null) {
            return ResponseEntity.ok(ApiResponse.success(token));
        } else {
            return ResponseEntity.status(404).body(ApiResponse.error(404, "Permanent token not found for user."));
        }
    }

    @PostMapping("/generate-permanent-token")
    public ResponseEntity<ApiResponse<String>> generatePermanentToken() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String newToken = userService.generateNewPermanentTokenForUser(username);
        if (newToken != null) {
            return ResponseEntity.ok(ApiResponse.success(newToken));
        } else {
            return ResponseEntity.status(500).body(ApiResponse.error(500, "Failed to generate new permanent token."));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ai.jamerly.tiein.entity.User>> getUserProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .map(user -> ResponseEntity.ok(ApiResponse.success(user)))
                .orElse(ResponseEntity.status(404).body(ApiResponse.error(404, "User profile not found.")));
    }
}