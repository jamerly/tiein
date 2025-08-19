package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.User;
import ai.jamerly.tiein.repository.UserRepository;
import ai.jamerly.tiein.security.jwt.JwtUtil; // Use the new JwtUtil
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SystemSettingService systemSettingService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.getRole() != null && !user.getRole().isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
        }
        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(), authorities);
    }

    public UserDetails loadUserByPermanentToken(String permanentToken) throws UsernameNotFoundException {
        User user = userRepository.findByPermanentToken(permanentToken)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with permanent token."));
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.getRole() != null && !user.getRole().isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
        }
        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(), authorities);
    }

    public String login(String username, String password) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                return jwtUtil.generateToken(username);
            }
        }
        return null; // Authentication failed
    }

    public boolean changePassword(String username, String oldPassword, String newPassword) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(oldPassword, user.getPassword())) {
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return true;
            }
        }
        return false; // Password change failed
    }

    public User register(String username, String password) {
        if (!systemSettingService.isRegistrationOpen()) {
            return null; // Registration is closed
        }
        if (userRepository.findByUsername(username).isPresent()) {
            return null; // User already exists
        }
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setPassword(passwordEncoder.encode(password));

        if (userRepository.count() == 0) {
            newUser.setRole("ADMIN");
        } else {
            newUser.setRole("USER");
        }
        newUser.generateNewPermanentToken(); // Generate permanent token for new user
        return userRepository.save(newUser);
    }

    public String getPermanentTokenForUser(String username) {
        return userRepository.findByUsername(username)
                .map(User::getPermanentToken)
                .orElse(null);
    }

    public String generateNewPermanentTokenForUser(String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    user.generateNewPermanentToken();
                    userRepository.save(user);
                    return user.getPermanentToken();
                })
                .orElse(null);
    }

    public long countUsers() {
        return userRepository.count();
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.generateNewPermanentToken(); // Generate permanent token for manually created user
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(updatedUser.getUsername());
                    if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                        user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
                    }
                    user.setRole(updatedUser.getRole());
                    // Do not update permanent token here unless explicitly requested
                    return userRepository.save(user);
                }).orElse(null);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
