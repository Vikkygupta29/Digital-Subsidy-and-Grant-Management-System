package com.infosys.subsidy.service;

import com.infosys.subsidy.entity.*;
import com.infosys.subsidy.repository.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final SchemeMasterRepository schemeMasterRepository;
    private final GrantApplicationRepository applicationRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final StagedDisbursementRepository stagedDisbursementRepository;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class OverallDashboardMetrics {
        private long totalBeneficiaries;
        private long totalSchemes;
        private long totalApplications;
        private double totalAllocatedBudget;
        private double totalDisbursedBudget;
        private double totalBudgetCapacity;
        private long pendingVerifications;
        private long approvedGrants;
        private long nonCompliantMilestones;
        private List<SchemeUtilizationMetric> schemeMetrics;
        private List<RegionUtilizationMetric> regionMetrics;
    }

    @Getter
    @AllArgsConstructor
    public static class SchemeUtilizationMetric {
        private String schemeName;
        private String schemeCode;
        private Double totalBudget;
        private Double allocatedBudget;
        private Double disbursedBudget;
        private Long applicationCount;
    }

    @Getter
    @AllArgsConstructor
    public static class RegionUtilizationMetric {
        private String regionName;
        private Long beneficiaryCount;
        private Long applicationCount;
        private Double totalDisbursedAmount;
    }

    public OverallDashboardMetrics getDashboardMetrics() {
        List<SchemeMaster> schemes = schemeMasterRepository.findAll();
        List<GrantApplication> applications = applicationRepository.findAll();
        List<BeneficiaryProfile> beneficiaries = beneficiaryProfileRepository.findAll();
        List<StagedDisbursement> disbursements = stagedDisbursementRepository.findAll();

        double totalBudgetCapacity = schemes.stream().mapToDouble(s -> s.getTotalBudget() != null ? s.getTotalBudget() : 0.0).sum();
        double totalAllocated = schemes.stream().mapToDouble(s -> s.getAllocatedBudget() != null ? s.getAllocatedBudget() : 0.0).sum();
        double totalDisbursed = schemes.stream().mapToDouble(s -> s.getDisbursedBudget() != null ? s.getDisbursedBudget() : 0.0).sum();

        long pendingVerifications = applications.stream()
                .filter(a -> a.getCurrentStage() == GrantApplication.ApplicationStage.FIELD_VERIFICATION
                        || a.getCurrentStage() == GrantApplication.ApplicationStage.DISTRICT_REVIEW
                        || a.getCurrentStage() == GrantApplication.ApplicationStage.FINANCE_APPROVAL)
                .count();

        long approvedGrants = applications.stream()
                .filter(a -> a.getCurrentStage() == GrantApplication.ApplicationStage.APPROVED)
                .count();

        long nonCompliant = disbursements.stream()
                .filter(d -> d.getStatus() == StagedDisbursement.MilestoneStatus.NON_COMPLIANT)
                .count();

        List<SchemeUtilizationMetric> schemeMetrics = schemes.stream().map(s -> new SchemeUtilizationMetric(
                s.getName(),
                s.getSchemeCode(),
                s.getTotalBudget(),
                s.getAllocatedBudget() != null ? s.getAllocatedBudget() : 0.0,
                s.getDisbursedBudget() != null ? s.getDisbursedBudget() : 0.0,
                applications.stream().filter(a -> a.getScheme().getId().equals(s.getId())).count()
        )).collect(Collectors.toList());

        Map<String, List<BeneficiaryProfile>> regionGroup = beneficiaries.stream()
                .collect(Collectors.groupingBy(b -> b.getRegion() != null ? b.getRegion() : "Central Region"));

        List<RegionUtilizationMetric> regionMetrics = new ArrayList<>();
        regionGroup.forEach((region, profs) -> {
            long appCount = applications.stream()
                    .filter(a -> a.getBeneficiary() != null && region.equals(a.getBeneficiary().getRegion()))
                    .count();
            double regionDisbursed = disbursements.stream()
                    .filter(d -> d.getStatus() == StagedDisbursement.MilestoneStatus.FUND_RELEASED
                            && d.getApplication() != null
                            && d.getApplication().getBeneficiary() != null
                            && region.equals(d.getApplication().getBeneficiary().getRegion()))
                    .mapToDouble(StagedDisbursement::getDisbursedAmount)
                    .sum();
            regionMetrics.add(new RegionUtilizationMetric(region, (long) profs.size(), appCount, regionDisbursed));
        });

        return OverallDashboardMetrics.builder()
                .totalBeneficiaries(beneficiaries.size())
                .totalSchemes(schemes.size())
                .totalApplications(applications.size())
                .totalAllocatedBudget(totalAllocated)
                .totalDisbursedBudget(totalDisbursed)
                .totalBudgetCapacity(totalBudgetCapacity)
                .pendingVerifications(pendingVerifications)
                .approvedGrants(approvedGrants)
                .nonCompliantMilestones(nonCompliant)
                .schemeMetrics(schemeMetrics)
                .regionMetrics(regionMetrics)
                .build();
    }
}
