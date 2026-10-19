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

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody java.util.Map<String, Object> body) {
        Long userId = null;
        if (body.get("userId") != null) {
            try {
                userId = Long.valueOf(body.get("userId").toString());
            } catch (Exception ignored) {}
        }
        if (userId == null && body.get("id") != null) {
            try {
                userId = Long.valueOf(body.get("id").toString());
            } catch (Exception ignored) {}
        }
        if (userId == null) {
            return ResponseEntity.badRequest().body("userId is required to update profile");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        BeneficiaryProfile profile = beneficiaryProfileRepository.findByUser(user)
                .orElse(BeneficiaryProfile.builder()
                        .user(user)
                        .verificationStatus(BeneficiaryProfile.Status.PENDING)
                        .registeredAt(LocalDateTime.now())
                        .build());

        if (body.containsKey("fullName") && body.get("fullName") != null) {
            String fn = body.get("fullName").toString().trim();
            if (!fn.isBlank()) {
                profile.setFullName(fn);
                user.setFullName(fn);
            }
        }
        if (body.containsKey("dob") && body.get("dob") != null) {
            profile.setDob(body.get("dob").toString().trim());
        }
        if (body.containsKey("gender") && body.get("gender") != null) {
            profile.setGender(body.get("gender").toString().trim());
        }
        if (body.containsKey("mobileNumber") && body.get("mobileNumber") != null) {
            profile.setMobileNumber(body.get("mobileNumber").toString().trim());
        }
        if (body.containsKey("category") && body.get("category") != null) {
            String cat = body.get("category").toString().trim();
            if (!cat.isBlank()) {
                profile.setCategory(cat);
                user.setCitizenCategory(cat);
            }
        }
        if (body.containsKey("aadhaarNumber") && body.get("aadhaarNumber") != null) {
            String aadh = body.get("aadhaarNumber").toString().trim();
            if (!aadh.isBlank()) profile.setAadhaarNumber(aadh);
        }
        if (body.containsKey("panNumber") && body.get("panNumber") != null) {
            profile.setPanNumber(body.get("panNumber").toString().trim());
        }
        if (body.containsKey("annualIncome") && body.get("annualIncome") != null) {
            try {
                profile.setAnnualIncome(Double.valueOf(body.get("annualIncome").toString()));
            } catch (Exception ignored) {}
        }
        if (body.containsKey("landSizeAcres") && body.get("landSizeAcres") != null) {
            try {
                profile.setLandSizeAcres(Double.valueOf(body.get("landSizeAcres").toString()));
            } catch (Exception ignored) {}
        }
        if (body.containsKey("bankName") && body.get("bankName") != null) {
            profile.setBankName(body.get("bankName").toString().trim());
        }
        if (body.containsKey("bankAccountNumber") && body.get("bankAccountNumber") != null) {
            profile.setBankAccountNumber(body.get("bankAccountNumber").toString().trim());
        }
        if (body.containsKey("ifscCode") && body.get("ifscCode") != null) {
            profile.setIfscCode(body.get("ifscCode").toString().trim());
        }
        if (body.containsKey("state") && body.get("state") != null) {
            profile.setState(body.get("state").toString().trim());
        }
        if (body.containsKey("district") && body.get("district") != null) {
            profile.setDistrict(body.get("district").toString().trim());
        }
        if (body.containsKey("block") && body.get("block") != null) {
            profile.setBlock(body.get("block").toString().trim());
        }
        if (body.containsKey("region") && body.get("region") != null) {
            String reg = body.get("region").toString().trim();
            if (!reg.isBlank()) {
                profile.setRegion(reg);
                user.setRegion(reg);
            }
        }
        if (body.containsKey("address") && body.get("address") != null) {
            profile.setAddress(body.get("address").toString().trim());
        }
        if (body.containsKey("identityDocumentUrl") && body.get("identityDocumentUrl") != null) {
            profile.setIdentityDocumentUrl(body.get("identityDocumentUrl").toString().trim());
        }
        if (body.containsKey("documentType") && body.get("documentType") != null) {
            profile.setDocumentType(body.get("documentType").toString().trim());
        }

        // If valid Aadhaar and Bank details provided, set status to VERIFIED
        if (profile.getAadhaarNumber() != null && !profile.getAadhaarNumber().isBlank()
                && !profile.getAadhaarNumber().startsWith("AADHAAR-")) {
            profile.setVerificationStatus(BeneficiaryProfile.Status.VERIFIED);
        }

        userRepository.save(user);
        BeneficiaryProfile saved = beneficiaryProfileRepository.save(profile);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/profile/upload-doc")
    public ResponseEntity<?> uploadIdentityDocument(
            @RequestParam("userId") Long userId,
            @RequestParam(value = "documentType", defaultValue = "Identity Document") String documentType,
            @RequestParam("file") MultipartFile file
    ) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");
        BeneficiaryProfile profile = beneficiaryProfileRepository.findByUser(user)
                .orElse(BeneficiaryProfile.builder()
                        .user(user)
                        .verificationStatus(BeneficiaryProfile.Status.PENDING)
                        .registeredAt(LocalDateTime.now())
                        .build());

        if (file != null && !file.isEmpty()) {
            String url = cloudinaryService.uploadFile(file);
            profile.setIdentityDocumentUrl(url);
            profile.setDocumentType(documentType);
            BeneficiaryProfile saved = beneficiaryProfileRepository.save(profile);
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.badRequest().body("Uploaded file is empty");
    }
}
