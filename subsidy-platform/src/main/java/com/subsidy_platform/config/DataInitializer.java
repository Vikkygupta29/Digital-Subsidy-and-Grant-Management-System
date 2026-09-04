package com.subsidy_platform.config;

import com.subsidy_platform.entity.User;
import com.subsidy_platform.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder encoder) {
        return args -> {
            createIfMissing(userRepository, encoder, "admin@subsidy.com", "password123", "ADMIN");
            createIfMissing(userRepository, encoder, "field@subsidy.com", "password123", "FIELD_OFFICER");
            createIfMissing(userRepository, encoder, "district@subsidy.com", "password123", "DISTRICT_OFFICER");
            createIfMissing(userRepository, encoder, "finance@subsidy.com", "password123", "FINANCE_APPROVER");
        };
    }

    private void createIfMissing(UserRepository repo, PasswordEncoder encoder,
                                 String email, String password, String role) {
        if (repo.findByEmail(email) != null) return;

        User user = new User();
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        user.setRole(role);
        repo.save(user);
    }
}
