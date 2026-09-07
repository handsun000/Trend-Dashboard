package com.trend.backend.config.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * 전역 REST API 예외 처리기 (Global Exception Handler)
 * - 외부 API 장애(Timeout, 5xx), 비즈니스 예외, 유효성 검증 실패를 포착하여 표준 ApiResponse 포맷으로 변환
 * - 오류 투명성 원칙: 외부 연동 실패 원인을 삼키지 않고 정직하게 로깅 및 전달
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 1. 비즈니스 및 도메인 예외 처리
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        ErrorCode code = ex.getErrorCode();
        log.warn("비즈니스 예외 발생 [{}]: {}", code.getCode(), ex.getDetailMessage());

        ApiResponse<Void> response = ApiResponse.error(
                code,
                ex.getDetailMessage(),
                ex.getCause() != null ? ex.getCause().getMessage() : null,
                ex.getErrorData()
        );

        return ResponseEntity.status(code.getHttpStatus()).body(response);
    }

    /**
     * 2. 요청 파라미터 유효성 검증 실패 (@Valid)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();
        Map<String, String> errors = new HashMap<>();

        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("요청 파라미터 유효성 검증 실패: {}", errors);

        ApiResponse<Void> response = ApiResponse.error(
                ErrorCode.INVALID_REQUEST,
                "입력 파라미터 유효성 검증에 실패하였습니다.",
                null,
                errors
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 3. 필수 요청 파라미터 누락
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParamException(MissingServletRequestParameterException ex) {
        String msg = String.format("필수 요청 파라미터 '%s'(타입: %s)가 누락되었습니다.", ex.getParameterName(), ex.getParameterType());
        log.warn("필수 파라미터 누락: {}", msg);

        ApiResponse<Void> response = ApiResponse.error(ErrorCode.MISSING_PARAMETER, msg);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 4. 지원하지 않는 HTTP Method
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        String msg = String.format("지원하지 않는 HTTP 메소드입니다: %s (지원: %s)", ex.getMethod(), ex.getSupportedHttpMethods());
        log.warn("HTTP 메소드 불일치: {}", msg);

        ApiResponse<Void> response = ApiResponse.error(ErrorCode.METHOD_NOT_ALLOWED, msg);
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }

    /**
     * 5. 정적 리소스 또는 엔드포인트 미발견 (404)
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException ex) {
        log.debug("리소스 미발견 (404): {}", ex.getResourcePath());
        ApiResponse<Void> response = ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, "요청하신 엔드포인트 또는 리소스를 찾을 수 없습니다: " + ex.getResourcePath());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * 6. 외부 API 통신 타임아웃 / 장애
     */
    @ExceptionHandler({TimeoutException.class, ResourceAccessException.class})
    public ResponseEntity<ApiResponse<Void>> handleExternalTimeout(Exception ex) {
        log.error("외부 연동 서비스 타임아웃/연결 장애 발생: {}", ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(
                ErrorCode.EXTERNAL_API_TIMEOUT,
                "외부 연동 서비스의 응답 지연으로 처리가 지연되었습니다.",
                ex.getMessage(),
                null
        );

        return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT).body(response);
    }

    /**
     * 7. 기타 외부 REST 클라이언트 통신 예외
     */
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<ApiResponse<Void>> handleRestClientException(RestClientException ex) {
        log.error("외부 연동 API 통신 오류 발생: {}", ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(
                ErrorCode.EXTERNAL_API_ERROR,
                "외부 데이터 서비스 통신 중 오류가 발생했습니다.",
                ex.getMessage(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
    }

    /**
     * 8. 최상위 예기치 못한 서버 내부 예외 (500)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("서버 내부 예외 발생 (500): {}", ex.getMessage(), ex);

        ApiResponse<Void> response = ApiResponse.error(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "서버 내부 처리 중 오류가 발생했습니다: " + ex.getMessage(),
                ex.getClass().getSimpleName(),
                null
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
