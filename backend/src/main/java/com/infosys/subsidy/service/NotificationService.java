package com.infosys.subsidy.service;

import com.infosys.subsidy.entity.Notification;
import com.infosys.subsidy.entity.User;
import com.infosys.subsidy.repository.NotificationRepository;
import com.infosys.subsidy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Dispatch notification to a specific user (In-App + Simulated SMS)
     */
    @Transactional
    public Notification sendToUser(
            User user,
            String title,
            String message,
            String type,
            Long applicationId,
            String applicationNo,
            String actionUrl,
            String phoneNumber
    ) {
        String phone = phoneNumber;
        String maskedPhone = maskPhoneNumber(phone);

        Notification notification = Notification.builder()
                .user(user)
                .recipientRole(user != null ? user.getRole().name() : "BENEFICIARY")
                .applicationId(applicationId)
                .applicationNo(applicationNo)
                .title(title)
                .message(message)
                .type(type != null ? type : "INFO")
                .channel(phone != null ? "BOTH" : "IN_APP")
                .isRead(false)
                .actionUrl(actionUrl)
                .smsRecipient(maskedPhone)
                .smsDeliveryStatus(phone != null ? "DELIVERED_VIA_CDAC_SMS_GATEWAY" : null)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("[NOTIFICATION] Sent to user {} ({}): {} | SMS: {}",
                user != null ? user.getUsername() : "ANONYMOUS",
                type, title, maskedPhone);
        return saved;
    }

    /**
     * Dispatch notification to all officers of a particular role (e.g. FIELD_OFFICER, DISTRICT_OFFICER, FINANCE_APPROVER)
     */
    @Transactional
    public Notification sendToRole(
            String role,
            String title,
            String message,
            String type,
            Long applicationId,
            String applicationNo,
            String actionUrl
    ) {
        Notification notification = Notification.builder()
                .user(null)
                .recipientRole(role)
                .applicationId(applicationId)
                .applicationNo(applicationNo)
                .title(title)
                .message(message)
                .type(type != null ? type : "INFO")
                .channel("IN_APP")
                .isRead(false)
                .actionUrl(actionUrl)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("[NOTIFICATION] Broadcast to role {}: [{}] {}", role, type, title);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(Long userId, String role) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        if (user != null) {
            return notificationRepository.findForUserOrRole(user, user.getRole().name());
        }
        if (role != null && !role.isBlank()) {
            return notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(role.toUpperCase());
        }
        return notificationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId, String role) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        if (user != null) {
            return notificationRepository.countUnreadForUserOrRole(user, user.getRole().name());
        }
        if (role != null && !role.isBlank()) {
            return notificationRepository.countUnreadForUserOrRole(null, role.toUpperCase());
        }
        return 0;
    }

    @Transactional
    public boolean markAsRead(Long id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            notificationRepository.save(n);
            return true;
        }).orElse(false);
    }

    @Transactional
    public int markAllAsRead(Long userId, String role) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        String resolvedRole = (user != null && user.getRole() != null) ? user.getRole().name() : (role != null ? role.toUpperCase() : "BENEFICIARY");
        return notificationRepository.markAllAsReadForUserOrRole(user, resolvedRole);
    }

    private String maskPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) return "+91 98765-XXXXX";
        String clean = phone.replaceAll("[^0-9]", "");
        if (clean.length() >= 10) {
            String last4 = clean.substring(clean.length() - 4);
            return "+91 XXXXX-" + last4;
        }
        return phone;
    }
}
