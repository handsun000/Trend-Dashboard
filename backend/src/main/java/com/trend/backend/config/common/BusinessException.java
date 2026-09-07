package com.trend.backend.config.common;

import lombok.Getter;

/**
 * 도메인 비즈니스 및 외부 연동 통신 예외 공통 클래스
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String detailMessage;
    private final Object errorData;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.detailMessage = errorCode.getMessage();
        this.errorData = null;
    }

    public BusinessException(ErrorCode errorCode, String detailMessage) {
        super(detailMessage != null ? detailMessage : errorCode.getMessage());
        this.errorCode = errorCode;
        this.detailMessage = detailMessage;
        this.errorData = null;
    }

    public BusinessException(ErrorCode errorCode, String detailMessage, Object errorData) {
        super(detailMessage != null ? detailMessage : errorCode.getMessage());
        this.errorCode = errorCode;
        this.detailMessage = detailMessage;
        this.errorData = errorData;
    }

    public BusinessException(ErrorCode errorCode, String detailMessage, Throwable cause) {
        super(detailMessage != null ? detailMessage : errorCode.getMessage(), cause);
        this.errorCode = errorCode;
        this.detailMessage = detailMessage;
        this.errorData = null;
    }
}
