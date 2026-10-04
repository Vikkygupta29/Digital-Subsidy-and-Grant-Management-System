package com.infosys.subsidy.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Direct recipient user (if specific to a user)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Target role (e.g. BENEFICIARY, FIELD_OFFICER, DISTRICT_OFFICER, FINANCE_APPROVER, ADMIN)
    @Column(name = "recipient_role", length = 50)
    private String recipientRole;

    // Optional application ID this notification refers to
    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "application_no", length = 50)
    private String applicationNo;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    // ACTION_REQUIRED, SUCCESS, WARNING, INFO, REJECTION, APPEAL, DISBURSEMENT
    @Column(length = 50, nullable = false)
    @Builder.Default
    private String type = "INFO";

    // IN_APP, SMS, BOTH
    @Column(length = 30)
    @Builder.Default
    private String channel = "BOTH";

    @Builder.Default
    private boolean isRead = false;

    // Optional navigation target URL / sub-tab in the dashboard
    @Column(name = "action_url", length = 255)
    private String actionUrl;

    // Phone number to which simulated SMS was delivered
    @Column(name = "sms_recipient", length = 50)
    private String smsRecipient;

    @Column(name = "sms_delivery_status", length = 50)
    @Builder.Default
    private String smsDeliveryStatus = "DELIVERED";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
