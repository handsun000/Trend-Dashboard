package com.trend.backend.client.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.RetryRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Configuration
public class ResilienceConfig {

    @Component
    @RequiredArgsConstructor
    public static class CircuitBreakerMonitor {

        private final CircuitBreakerRegistry circuitBreakerRegistry;

        public String resolveInstanceName(String providerOrInstance) {
            if (providerOrInstance == null) return "default";
            String key = providerOrInstance.trim().toLowerCase().replace("_", "");
            if ("molit".equals(key) || "kma".equals(key)) {
                return "publicdata";
            }
            return key;
        }

        public String getCircuitBreakerState(String name) {
            String instanceName = resolveInstanceName(name);
            return Optional.ofNullable(circuitBreakerRegistry.find(instanceName))
                    .flatMap(opt -> opt.map(cb -> cb.getState().name()))
                    .orElse("N/A");
        }

        public Float getFailureRate(String name) {
            String instanceName = resolveInstanceName(name);
            return Optional.ofNullable(circuitBreakerRegistry.find(instanceName))
                    .flatMap(opt -> opt.map(cb -> {
                        float rate = cb.getMetrics().getFailureRate();
                        return rate >= 0 ? rate : 0.0f;
                    }))
                    .orElse(0.0f);
        }

        public CircuitBreaker getCircuitBreaker(String name) {
            String instanceName = resolveInstanceName(name);
            return circuitBreakerRegistry.circuitBreaker(instanceName);
        }
    }
}
