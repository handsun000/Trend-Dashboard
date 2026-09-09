package com.trend.backend.client;

import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.client.config.ResilienceConfig;
import com.trend.backend.config.common.ApiResponse;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Resilience4jCircuitBreakerTest {

    @Test
    @DisplayName("1. CircuitBreakerMonitor 인스턴스 이름 해석 및 기본 상태 조회")
    void testCircuitBreakerMonitorResolution() {
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.ofDefaults();
        registry.circuitBreaker("kis");
        registry.circuitBreaker("publicdata");

        ResilienceConfig.CircuitBreakerMonitor monitor = new ResilienceConfig.CircuitBreakerMonitor(registry);

        assertEquals("kis", monitor.resolveInstanceName("KIS"));
        assertEquals("publicdata", monitor.resolveInstanceName("MOLIT"));
        assertEquals("publicdata", monitor.resolveInstanceName("KMA"));
        assertEquals("exchangerate", monitor.resolveInstanceName("EXCHANGE_RATE"));

        assertEquals("CLOSED", monitor.getCircuitBreakerState("KIS"));
        assertEquals(0.0f, monitor.getFailureRate("KIS"));
        assertEquals("CLOSED", monitor.getCircuitBreakerState("MOLIT"));
    }

    @Test
    @DisplayName("2. 서킷 브레이커 실패율 초과 시 OPEN 상태 전이 및 Fail-Fast 검증")
    void testCircuitBreakerOpenTransition() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .slidingWindowSize(4)
                .minimumNumberOfCalls(2)
                .failureRateThreshold(50.0f)
                .build();
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);
        CircuitBreaker cb = registry.circuitBreaker("test-service");

        ResilienceConfig.CircuitBreakerMonitor monitor = new ResilienceConfig.CircuitBreakerMonitor(registry);
        assertEquals(CircuitBreaker.State.CLOSED, cb.getState());

        // 2회 연속 실패 기록
        cb.onError(0, java.util.concurrent.TimeUnit.MILLISECONDS, new IOException("Connection timeout"));
        cb.onError(0, java.util.concurrent.TimeUnit.MILLISECONDS, new IOException("Connection reset"));

        // 임계치(50%) 초과로 OPEN 전이 확인
        assertEquals(CircuitBreaker.State.OPEN, cb.getState());
        assertEquals("OPEN", monitor.getCircuitBreakerState("test-service"));
        assertTrue(monitor.getFailureRate("test-service") >= 50.0f);
    }

    @Test
    @DisplayName("3. ExternalApiStatusController 서킷 브레이커 상태 및 지표 매핑 검증")
    void testExternalApiStatusControllerWithCircuitBreaker() {
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.ofDefaults();
        registry.circuitBreaker("kis");
        ResilienceConfig.CircuitBreakerMonitor monitor = new ResilienceConfig.CircuitBreakerMonitor(registry);

        ExternalApiClient mockClient = mock(ExternalApiClient.class);
        when(mockClient.getProviderName()).thenReturn("KIS");
        when(mockClient.checkHealth()).thenReturn(ExternalApiHealth.healthy("KIS", "정상 연결", 42));

        ExternalApiStatusController controller = new ExternalApiStatusController(List.of(mockClient), monitor);
        ApiResponse<List<ExternalApiHealth>> response = controller.getExternalApiStatuses();

        assertNotNull(response);
        assertEquals("SUCCESS", response.getCode());
        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().size());

        ExternalApiHealth health = response.getData().get(0);
        assertEquals("KIS", health.getProvider());
        assertEquals("CLOSED", health.getCircuitBreakerState());
        assertEquals(0.0f, health.getFailureRate());
        assertEquals(ExternalApiHealth.Status.HEALTHY, health.getStatus());
    }
}
