package com.infosys.subsidy.subsidy_platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.infosys.subsidy")
@EnableJpaRepositories("com.infosys.subsidy.repository")
@EntityScan("com.infosys.subsidy.entity")
public class SubsidyPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(SubsidyPlatformApplication.class, args);
	}

}
