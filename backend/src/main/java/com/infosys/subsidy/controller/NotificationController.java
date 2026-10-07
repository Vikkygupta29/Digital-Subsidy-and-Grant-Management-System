package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.Notification;
import com.infosys.subsidy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "role", required = false) String role
    ) {
        List<NotificationResponse> response = notificationService.getNotifications(userId, role)
                .stream()
                .map(NotificationResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "role", required = false) String role
    ) {
        long count = notificationService.getUnreadCount(userId, role);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        boolean success = notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("success", success));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "role", required = false) String role
    ) {
        int updatedCount = notificationService.markAllAsRead(userId, role);
        return ResponseEntity.ok(Map.of("updatedCount", updatedCount));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable Long id,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "role", required = false) String role
    ) {
        boolean deleted = notificationService.deleteNotification(id, userId, role);
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    @PutMapping("/{id}/remove")
    public ResponseEntity<Map<String, Object>> removeNotification(
            @PathVariable Long id,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "role", required = false) String role
    ) {
        boolean removed = notificationService.deleteNotification(id, userId, role);
        return ResponseEntity.ok(Map.of("removed", removed));
    }

    private record NotificationResponse(
            Long id,
            String recipientRole,
            Long applicationId,
            String applicationNo,
            String title,
            String message,
            String type,
            String channel,
            String actionUrl,
            String smsRecipient,
            String smsDeliveryStatus,
            LocalDateTime createdAt,
            boolean read
    ) {
        private static NotificationResponse from(Notification notification) {
            return new NotificationResponse(
                    notification.getId(),
                    notification.getRecipientRole(),
                    notification.getApplicationId(),
                    notification.getApplicationNo(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.getType(),
                    notification.getChannel(),
                    notification.getActionUrl(),
                    notification.getSmsRecipient(),
                    notification.getSmsDeliveryStatus(),
                    notification.getCreatedAt(),
                    notification.isRead()
            );
        }
    }
}
