package com.trend.backend.config.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 전사 표준 공통 API 응답 포맷
 * - 성공/실패 시 일관된 스키마 제공
 * - 오류 투명성 원칙에 따른 시스템 상태(LIVE, DEGRADED, ERROR 등) 및 원본 에러 보존
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String code;
    private String message;
    private T data;
    private ErrorDetails error;

    @Builder.Default
    private String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetails {
        private String errorCode;
        private String systemStatus; // LIVE, STALE, DEGRADED, ERROR
        private String originalError; // 외부 API 원본 에러 메시지
        private Object details;       // 유효성 검증 실패 필드 등
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .code("SUCCESS")
                .message("요청이 정상적으로 처리되었습니다.")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .code("SUCCESS")
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .error(ErrorDetails.builder()
                        .errorCode(errorCode.name())
                        .systemStatus("ERROR")
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> error(ErrorCode errorCode, String customMessage) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(customMessage != null ? customMessage : errorCode.getMessage())
                .error(ErrorDetails.builder()
                        .errorCode(errorCode.name())
                        .systemStatus("ERROR")
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> error(ErrorCode errorCode, String customMessage, String originalError, Object details) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(customMessage != null ? customMessage : errorCode.getMessage())
                .error(ErrorDetails.builder()
                        .errorCode(errorCode.name())
                        .systemStatus("DEGRADED")
                        .originalError(originalError)
                        .details(details)
                        .build())
                .build();
    }
}
