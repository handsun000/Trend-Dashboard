package com.trend.backend.alert;

import com.trend.backend.domain.UserAlert;
import com.trend.backend.domain.UserAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAlertService {

    private final UserAlertRepository userAlertRepository;

    public UserAlert createAlert(UserAlertRequestDto dto) {
        UserAlert alert = new UserAlert();
        alert.setUserId(dto.getUserId() != null ? dto.getUserId() : "user1");
        alert.setTicker(dto.getTicker());
        alert.setTargetPrice(dto.getTargetPrice());
        alert.setIsActive(true);
        return userAlertRepository.save(alert);
    }

    public List<UserAlert> getUserAlerts(String userId) {
        return userAlertRepository.findByUserIdAndIsActiveTrue(userId != null ? userId : "user1");
    }

    public void deleteAlert(Long id) {
        userAlertRepository.deleteById(id);
    }
}
