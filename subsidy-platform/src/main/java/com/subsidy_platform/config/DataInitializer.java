package com.subsidy_platform.config;

import com.subsidy_platform.entity.Scheme;
import com.subsidy_platform.entity.User;
import com.subsidy_platform.repository.SchemeRepository;
import com.subsidy_platform.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            SchemeRepository schemeRepository,
            PasswordEncoder encoder
    ) {
        return args -> {
            createIfMissing(userRepository, encoder, "admin@subsidy.com", "password123", "ADMIN");
            createIfMissing(userRepository, encoder, "field@subsidy.com", "password123", "FIELD_OFFICER");
            createIfMissing(userRepository, encoder, "district@subsidy.com", "password123", "DISTRICT_OFFICER");
            createIfMissing(userRepository, encoder, "finance@subsidy.com", "password123", "FINANCE_APPROVER");

            if (schemeRepository.count() == 0) {
                createScheme(schemeRepository, "Agricultural Modernization Support Grant", 50000.0,
                        "{\"minIncome\": 0, \"maxIncome\": 250000, \"category\": \"Farmer\"}");
                createScheme(schemeRepository, "Small Business Digitalization Subsidy", 75000.0,
                        "{\"minIncome\": 0, \"maxIncome\": 500000, \"category\": \"Small Business\"}");
                createScheme(schemeRepository, "Artisan & Craft Equipment Grant", 30000.0,
                        "{\"minIncome\": 0, \"maxIncome\": 200000, \"category\": \"Artisan\"}");
            }
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

    private void createScheme(SchemeRepository repo, String name, double grantAmount, String criteria) {
        Scheme scheme = new Scheme();
        scheme.setName(name);
        scheme.setGrantAmount(grantAmount);
        scheme.setCriteriaSchema(criteria);
        repo.save(scheme);
    }
}
