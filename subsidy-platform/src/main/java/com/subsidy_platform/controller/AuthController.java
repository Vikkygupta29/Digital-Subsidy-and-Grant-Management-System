package com.subsidy_platform.controller;

import com.subsidy_platform.dto.AuthResponse;
import com.subsidy_platform.dto.LoginRequest;
import com.subsidy_platform.dto.RegisterRequest;
import com.subsidy_platform.entity.Beneficiary;
import com.subsidy_platform.entity.User;
import com.subsidy_platform.exception.BadRequestException;
import com.subsidy_platform.repository.BeneficiaryRepository;
import com.subsidy_platform.repository.UserRepository;
import com.subsidy_platform.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepo;
    private final BeneficiaryRepository beneficiaryRepo;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepo.findByEmail(email);
        if (user == null) {
            throw new BadRequestException("Invalid email or password");
        }

        String role = normalizeRole(user.getRole());
        String frontendRole = role.substring(5); // ROLE_ADMIN -> ADMIN

        String token = jwtUtil.generateToken(email, frontendRole);

        return ResponseEntity.ok(
                new AuthResponse(
                        token,
                        user.getId(),
                        user.getEmail(),
                        frontendRole
                )
        );
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepo.existsByEmail(email)) {
            throw new BadRequestException("Email already exists");
        }

        // Create User account for authentication
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("BENEFICIARY");
        userRepo.save(user);

        // Auto-create Beneficiary profile for grant applications
        if (beneficiaryRepo.findByEmailIgnoreCase(email).isEmpty()) {
            Beneficiary beneficiary = new Beneficiary();
            beneficiary.setEmail(email);
            String namePrefix = email.contains("@") ? email.substring(0, email.indexOf("@")) : email;
            String formattedName = namePrefix.substring(0, 1).toUpperCase() + namePrefix.substring(1);
            beneficiary.setName(formattedName);
            beneficiary.setPhone("9876543210");
            beneficiary.setCategory("General");
            beneficiary.setRegion("Central District");
            beneficiaryRepo.save(beneficiary);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Beneficiary account registered successfully",
                "role", "BENEFICIARY"
        ));
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            throw new BadRequestException("User role is not configured");
        }

        String normalized = role.trim().toUpperCase();
        return normalized.startsWith("ROLE_")
                ? normalized
                : "ROLE_" + normalized;
    }
}
