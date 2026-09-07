package com.trend.backend.config.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 시스템 공통 표준 에러 코드
 * - 외부 API 장애(타임아웃, 거절 등), 클라이언트 파라미터 검증, 서버 내부 예외를 세분화하여 정의
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 400 Bad Request
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "C001", "잘못된 요청 파라미터입니다."),
    MISSING_PARAMETER(HttpStatus.BAD_REQUEST, "C002", "필수 파라미터가 누락되었습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C003", "지원하지 않는 HTTP 메소드입니다."),

    // 401 & 403 Authentication / Authorization
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "A001", "인증 정보가 유효하지 않거나 세션이 만료되었습니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "A002", "해당 리소스에 접근할 권한이 없습니다."),

    // 404 Not Found
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "R001", "요청하신 리소스를 찾을 수 없습니다."),

    // 429 Too Many Requests / Rate Limiting
    RATE_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "L001", "단시간 내 너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해 주세요."),

    // 502 Bad Gateway / External API Failure
    EXTERNAL_API_ERROR(HttpStatus.BAD_GATEWAY, "E001", "외부 연동 서비스와의 통신 중 오류가 발생했습니다."),
    EXTERNAL_API_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "E002", "외부 연동 서비스 응답 시간이 초과되었습니다."),
    EXTERNAL_API_CIRCUIT_OPEN(HttpStatus.SERVICE_UNAVAILABLE, "E003", "외부 연동 서비스 장애로 인해 일시적으로 요청이 차단되었습니다."),

    // 500 Internal Server Error
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S001", "서버 내부 처리 중 예기치 못한 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
