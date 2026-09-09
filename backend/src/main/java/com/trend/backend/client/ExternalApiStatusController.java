package com.trend.backend.client;

import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.config.common.ApiResponse;
import com.trend.backend.client.config.ResilienceConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping({"/api/v1/system/external-apis", "/api/system/external-apis"})
@RequiredArgsConstructor
public class ExternalApiStatusController {

    private final List<ExternalApiClient> externalApiClients;
    private final ResilienceConfig.CircuitBreakerMonitor circuitBreakerMonitor;

    @GetMapping
    public ApiResponse<List<ExternalApiHealth>> getExternalApiStatuses() {
        List<ExternalApiHealth> statuses = externalApiClients.stream()
                .map(client -> {
                    ExternalApiHealth health;
                    try {
                        health = client.checkHealth();
                    } catch (Exception e) {
                        log.error("Failed to check health for external API provider [{}]: {}", client.getProviderName(), e.getMessage());
                        health = ExternalApiHealth.unavailable(client.getProviderName(), "헬스 체크 실패: " + e.getMessage(), 0);
                    }

                    String cbState = circuitBreakerMonitor.getCircuitBreakerState(client.getProviderName());
                    Float failureRate = circuitBreakerMonitor.getFailureRate(client.getProviderName());
                    return health.withCircuitBreaker(cbState, failureRate);
                })
                .collect(Collectors.toList());

        boolean hasUnavailable = statuses.stream().anyMatch(s -> s.getStatus() == ExternalApiHealth.Status.UNAVAILABLE);
        String message = hasUnavailable ? "일부 외부 연동망에 장애 또는 미설정 상태가 감지되었습니다 (DEGRADED)" : "모든 외부 API 연동망이 정상 동작 중입니다 (LIVE)";

        return ApiResponse.ok(message, statuses);
    }
}

