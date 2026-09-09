package com.trend.backend.client.common;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ExternalApiHealth {

    public enum Status {
        HEALTHY,
        DEGRADED,
        UNAVAILABLE,
        UNCONFIGURED
    }

    private String provider;
    private Status status;
    private String message;
    private long latencyMs;
    private LocalDateTime timestamp;
    private String circuitBreakerState;
    private Float failureRate;

    public ExternalApiHealth withCircuitBreaker(String circuitBreakerState, Float failureRate) {
        return ExternalApiHealth.builder()
                .provider(this.provider)
                .status(this.status)
                .message(this.message)
                .latencyMs(this.latencyMs)
                .timestamp(this.timestamp)
                .circuitBreakerState(circuitBreakerState)
                .failureRate(failureRate)
                .build();
    }


    public static ExternalApiHealth healthy(String provider, String message, long latencyMs) {
        return ExternalApiHealth.builder()
                .provider(provider)
                .status(Status.HEALTHY)
                .message(message)
                .latencyMs(latencyMs)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ExternalApiHealth unconfigured(String provider, String message) {
        return ExternalApiHealth.builder()
                .provider(provider)
                .status(Status.UNCONFIGURED)
                .message(message)
                .latencyMs(0)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ExternalApiHealth degraded(String provider, String message, long latencyMs) {
        return ExternalApiHealth.builder()
                .provider(provider)
                .status(Status.DEGRADED)
                .message(message)
                .latencyMs(latencyMs)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ExternalApiHealth unavailable(String provider, String message, long latencyMs) {
        return ExternalApiHealth.builder()
                .provider(provider)
                .status(Status.UNAVAILABLE)
                .message(message)
                .latencyMs(latencyMs)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
