//package com.subsidy_platform.controller;
//
//import com.subsidy_platform.entity.Application;
//import com.subsidy_platform.repository.ApplicationRepository;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/analytics")
//public class AnalyticsController {
//
//    private final ApplicationRepository appRepo;
//
//    public AnalyticsController(ApplicationRepository appRepo) {
//        this.appRepo = appRepo;
//    }
//
//    @PreAuthorize("hasRole('ADMIN')") // Matches ROLE_ADMIN
//    @GetMapping("/summary")
//    public Map<String, Object> getSystemAnalytics() {
//        Map<String, Object> stats = new HashMap<>();
//
//        long totalApps = appRepo.count();
//        long rejected = appRepo.countByCurrentStage("REJECTED");
//        long fullyApproved = appRepo.countByCurrentStage("APPROVED_FUNDS_DISBURSED");
//        long pendingField = appRepo.countByCurrentStage("FIELD_REVIEW");
//        long pendingDistrict = appRepo.countByCurrentStage("DISTRICT_REVIEW");
//        long pendingFinance = appRepo.countByCurrentStage("FINANCE_REVIEW");
//
//        List<Application> approvedApps = appRepo.findByCurrentStage("APPROVED_FUNDS_DISBURSED");
//        double totalFunds = approvedApps.stream()
//                .mapToDouble(app -> app.getScheme().getGrantAmount())
//                .sum();
//
//        stats.put("totalApplications", totalApps);
//        stats.put("rejected", rejected);
//        stats.put("fullyApproved", fullyApproved);
//        stats.put("totalFundsDisbursed", totalFunds);
//        stats.put("activeInPipeline", pendingField + pendingDistrict + pendingFinance);
//
//        return stats;
//    }
//}