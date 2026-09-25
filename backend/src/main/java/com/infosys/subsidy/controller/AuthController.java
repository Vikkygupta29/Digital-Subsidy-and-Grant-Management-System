package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.repository.UserRepository;
import com.infosys.subsidy.service.AuditService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignupRequest {
        private String username;
        private String password;
        private String fullName;
        private String email;
        private User.Role role;
        private String region;
    }

    @Getter
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private User user;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists. Please choose a different username.");
        }

        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(request.getRole() != null ? request.getRole() : User.Role.BENEFICIARY)
                .region(request.getRegion() != null ? request.getRegion() : "National")
                .build();

        User savedUser = userRepository.save(newUser);

        auditService.logAction(
                "USER_SIGNUP",
                savedUser.getUsername(),
                savedUser.getRole().name(),
                "User",
                savedUser.getId().toString(),
                "Registered new account with role " + savedUser.getRole() + " in region " + savedUser.getRegion()
        );

        String token = "JWT-TOKEN-" + savedUser.getUsername().toUpperCase() + "-" + savedUser.getRole().name();
        return ResponseEntity.ok(new AuthResponse(token, savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid username or password");
        }

        auditService.logAction(
                "USER_LOGIN",
                user.getUsername(),
                user.getRole().name(),
                "User",
                user.getId().toString(),
                "User logged into the platform"
        );

        String token = "JWT-TOKEN-" + user.getUsername().toUpperCase() + "-" + user.getRole().name();
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
