package com.infosys.subsidy.repository;

import com.infosys.subsidy.entity.Notification;
import com.infosys.subsidy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Fetch user notifications: either directly addressed to user or addressed to their role
    @Query("SELECT n FROM Notification n WHERE (n.user = :user OR (n.user IS NULL AND n.recipientRole = :role)) ORDER BY n.createdAt DESC")
    List<Notification> findForUserOrRole(@Param("user") User user, @Param("role") String role);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.user = :user OR (n.user IS NULL AND n.recipientRole = :role)) AND n.isRead = false")
    long countUnreadForUserOrRole(@Param("user") User user, @Param("role") String role);

    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE (n.user = :user OR (n.user IS NULL AND n.recipientRole = :role)) AND n.isRead = false")
    int markAllAsReadForUserOrRole(@Param("user") User user, @Param("role") String role);
}
