package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.BeneficiaryProfile;
import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.repository.BeneficiaryProfileRepository;
import com.infosys.subsidy.repository.UserRepository;
import com.infosys.subsidy.service.AuditService;
import com.infosys.subsidy.service.TurnstileService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final com.infosys.subsidy.service.JwtService jwtService;
    private final TurnstileService turnstileService;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
        private String turnstileToken;
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
        private String citizenCategory;
        private String turnstileToken;
        private String mobileNumber;
        private String aadhaarNumber;
        private String dob;
        private String gender;
        private String state;
        private String district;
        private String block;
        private String address;
        private Double annualIncome;
        private Double landSizeAcres;
    }

    @Getter
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private User user;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (!turnstileService.verify(request.getTurnstileToken())) {
            return ResponseEntity.badRequest().body("CAPTCHA verification failed. Please complete the security check again.");
        }
        if (request.getRole() != null && request.getRole() != User.Role.BENEFICIARY) {
            return ResponseEntity.badRequest().body("Public signup is only available for beneficiary citizen accounts.");
        }
        return createUser(request);
    }

    @PostMapping("/officers")
    public ResponseEntity<?> createOfficer(@RequestParam Long adminUserId, @RequestBody SignupRequest request) {
        User admin = userRepository.findById(adminUserId).orElse(null);
        if (admin == null || admin.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Only an administrator can create officer accounts.");
        }
        if (request.getRole() == null || request.getRole() == User.Role.BENEFICIARY || request.getRole() == User.Role.ADMIN) {
            return ResponseEntity.badRequest().body("Select a valid officer role.");
        }
        return createUser(request);
    }

    private ResponseEntity<?> createUser(SignupRequest request) {
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
                .citizenCategory(request.getCitizenCategory() != null ? request.getCitizenCategory() : "Other Citizen")
                .build();

        User savedUser = userRepository.save(newUser);

        if (savedUser.getRole() == User.Role.BENEFICIARY) {
            String aadhaar = request.getAadhaarNumber() != null && !request.getAadhaarNumber().isBlank()
                    ? request.getAadhaarNumber().trim()
                    : null;
            BeneficiaryProfile.Status status = (aadhaar != null && !aadhaar.isBlank())
                    ? BeneficiaryProfile.Status.VERIFIED
                    : BeneficiaryProfile.Status.PENDING;

            BeneficiaryProfile profile = BeneficiaryProfile.builder()
                    .user(savedUser)
                    .fullName(savedUser.getFullName() != null && !savedUser.getFullName().isBlank() ? savedUser.getFullName() : savedUser.getUsername())
                    .aadhaarNumber(aadhaar)
                    .category(savedUser.getCitizenCategory() != null && !savedUser.getCitizenCategory().isBlank() ? savedUser.getCitizenCategory() : "General")
                    .region(savedUser.getRegion() != null && !savedUser.getRegion().isBlank() ? savedUser.getRegion() : "National")
                    .mobileNumber(request.getMobileNumber() != null && !request.getMobileNumber().isBlank() ? request.getMobileNumber().trim() : null)
                    .dob(request.getDob() != null && !request.getDob().isBlank() ? request.getDob().trim() : null)
                    .gender(request.getGender() != null && !request.getGender().isBlank() ? request.getGender().trim() : null)
                    .state(request.getState() != null && !request.getState().isBlank() ? request.getState().trim() : null)
                    .district(request.getDistrict() != null && !request.getDistrict().isBlank() ? request.getDistrict().trim() : null)
                    .block(request.getBlock() != null && !request.getBlock().isBlank() ? request.getBlock().trim() : null)
                    .address(request.getAddress() != null && !request.getAddress().isBlank() ? request.getAddress().trim() : null)
                    .annualIncome(request.getAnnualIncome() != null ? request.getAnnualIncome() : null)
                    .landSizeAcres(request.getLandSizeAcres() != null ? request.getLandSizeAcres() : null)
                    .verificationStatus(status)
                    .registeredAt(LocalDateTime.now())
                    .build();
            beneficiaryProfileRepository.save(profile);
        }

        auditService.logAction(
                "USER_SIGNUP",
                savedUser.getUsername(),
                savedUser.getRole().name(),
                "User",
                savedUser.getId().toString(),
                "Registered new account with role " + savedUser.getRole() + " in region " + savedUser.getRegion()
        );

        String token = jwtService.generateToken(savedUser);
        return ResponseEntity.ok(new AuthResponse(token, savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (!turnstileService.verify(request.getTurnstileToken())) {
            return ResponseEntity.badRequest().body("CAPTCHA verification failed. Please complete the security check again.");
        }
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            auditService.logAction(
                    "LOGIN_FAILED",
                    request.getUsername(),
                    "UNKNOWN",
                    "User",
                    request.getUsername(),
                    "Invalid username or password"
            );
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

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, user));
    }


    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
