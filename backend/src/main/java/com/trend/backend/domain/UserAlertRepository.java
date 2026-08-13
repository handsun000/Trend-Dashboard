package com.trend.backend.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAlertRepository extends JpaRepository<UserAlert, Long> {
    List<UserAlert> findByIsActiveTrue();
    List<UserAlert> findByTickerAndIsActiveTrue(String ticker);
    List<UserAlert> findByUserIdAndIsActiveTrue(String userId);
}
