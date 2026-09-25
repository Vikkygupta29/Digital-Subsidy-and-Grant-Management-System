package com.infosys.subsidy.controller;

import com.infosys.subsidy.entity.Notification;
import com.infosys.subsidy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "role", required = false) String role
    ) {
        return ResponseEntity.ok(notificationService.getNotifications(userId, role));
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
}
