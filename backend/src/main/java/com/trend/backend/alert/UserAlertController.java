package com.trend.backend.alert;

import com.trend.backend.domain.UserAlert;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class UserAlertController {

    private final UserAlertService userAlertService;

    @PostMapping
    public ResponseEntity<UserAlert> createAlert(@RequestBody UserAlertRequestDto dto) {
        return ResponseEntity.ok(userAlertService.createAlert(dto));
    }

    @GetMapping
    public ResponseEntity<List<UserAlert>> getAlerts(@RequestParam(defaultValue = "user1") String userId) {
        return ResponseEntity.ok(userAlertService.getUserAlerts(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable Long id) {
        userAlertService.deleteAlert(id);
        return ResponseEntity.noContent().build();
    }
}
