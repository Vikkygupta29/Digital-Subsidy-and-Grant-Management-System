package com.infosys.subsidy.config;

import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.username:}")
    private String username;

    @Value("${app.bootstrap-admin.password:}")
    private String password;

    @Value("${app.bootstrap-admin.full-name:System Administrator}")
    private String fullName;

    @Value("${app.bootstrap-admin.email:}")
    private String email;

    @Override
    public void run(String... args) {
        if (username.isBlank() && password.isBlank()) {
            log.info("Bootstrap admin is not configured; no administrator account was created.");
            return;
        }
        if (username.isBlank() || password.isBlank()) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD must be provided together."
            );
        }

        java.util.Optional<User> existingUserOpt = userRepository.findByUsername(username);
        if (existingUserOpt.isPresent()) {
            User existingAdmin = existingUserOpt.get();
            existingAdmin.setPassword(passwordEncoder.encode(password));
            existingAdmin.setRole(User.Role.ADMIN);
            if (fullName != null && !fullName.isBlank()) {
                existingAdmin.setFullName(fullName);
            }
            if (email != null && !email.isBlank()) {
                existingAdmin.setEmail(email);
            }
            userRepository.save(existingAdmin);
            log.info("Synchronized bootstrap admin credentials for account '{}' from environment variables.", username);
            return;
        }

        User admin = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .email(email)
                .role(User.Role.ADMIN)
                .region("National HQ")
                .citizenCategory("Government Administrator")
                .build();

        userRepository.save(admin);
        log.info("Created bootstrap administrator account '{}'. Remove the bootstrap credentials after first login.", username);
    }
}
