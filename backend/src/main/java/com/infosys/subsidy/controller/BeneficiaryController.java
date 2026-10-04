package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.BeneficiaryProfile;
import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.repository.BeneficiaryProfileRepository;
import com.infosys.subsidy.repository.UserRepository;
import com.infosys.subsidy.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BeneficiaryController {

    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    public ResponseEntity<List<BeneficiaryProfile>> getAllBeneficiaries() {
        return ResponseEntity.ok(beneficiaryProfileRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBeneficiaryById(@PathVariable Long id) {
        return beneficiaryProfileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getBeneficiaryByUserId(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        return beneficiaryProfileRepository.findByUser(user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerBeneficiary(
            @RequestParam("userId") Long userId,
            @RequestParam("aadhaarNumber") String aadhaarNumber,
            @RequestParam(value = "panNumber", required = false) String panNumber,
            @RequestParam("fullName") String fullName,
            @RequestParam("category") String category,
            @RequestParam("annualIncome") Double annualIncome,
            @RequestParam("landSizeAcres") Double landSizeAcres,
            @RequestParam("region") String region,
            @RequestParam("address") String address,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "document", required = false) MultipartFile documentFile
    ) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        String documentUrl = null;
        if (documentFile != null && !documentFile.isEmpty()) {
            documentUrl = cloudinaryService.uploadFile(documentFile);
        }

        BeneficiaryProfile profile = BeneficiaryProfile.builder()
                .user(user)
                .aadhaarNumber(aadhaarNumber)
                .panNumber(panNumber)
                .fullName(fullName)
                .category(category)
                .annualIncome(annualIncome)
                .landSizeAcres(landSizeAcres)
                .region(region)
                .address(address)
                .documentType(documentType != null ? documentType : "Identity Document")
                .identityDocumentUrl(documentUrl)
                .verificationStatus(BeneficiaryProfile.Status.VERIFIED)
                .registeredAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(beneficiaryProfileRepository.save(profile));
    }
}
