package com.trend.backend.domain.korail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class KorailDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String memberNo; // 회원번호 (10자리)
        private String password; // 비밀번호
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginSession {
        private boolean loggedIn;
        private String memberNo;
        private String customerName;
        private String customerNo;
        private String key;
        private String cookies;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchRequest {
        private String departureStation; // 예: 수서 또는 0551
        private String arrivalStation;   // 예: 부산 또는 0020
        private String date;             // YYYYMMDD (예: 20260909)
        private String hour;             // HHmmss (예: 000000 또는 060000)
        private String trainGroup;       // 100(KTX) 또는 109(전체)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrainSchedule {
        private String trainNo;          // 열차번호 (예: 301)
        private String trainType;        // 열차종류 (KTX, KTX-산천 등)
        private String departureStation; // 출발역 (수서)
        private String departureStationCode;
        private String departureDate;    // YYYYMMDD
        private String departureTime;    // HH:mm (05:30)
        private String departureTimeRaw; // 053000
        private String arrivalStation;   // 도착역 (부산)
        private String arrivalStationCode;
        private String arrivalTime;      // HH:mm (08:06)
        private String arrivalTimeRaw;   // 080600
        private String runTime;          // 소요시간 (02:36)
        private int price;               // 일반실 운임 요금 (52300)

        // 좌석 및 예매 상태
        private String generalSeatStatus; // 좌석많음, 매진 등
        private boolean generalAvailable; // 일반실 예약 가능 여부
        private String specialSeatStatus; // 좌석많음, 매진 등
        private boolean specialAvailable; // 특실 예약 가능 여부
        private boolean waitAvailable;    // 예매대기 신청 가능 여부 (h_wait_rsv_flg == " 9")
        private int waitQueueCount;       // 예매대기 잔여 정원 (예: 25명)

        // 예약 호출 시 필요한 내부 메타데이터
        private String runDate;          // h_run_dt
        private String trainGroupCode;   // h_trn_gp_cd (100)
        private String trainClassCode;   // h_trn_clsf_cd (00, 07, 0A)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResponse {
        private boolean success;
        private String message;
        private int totalCount;
        private List<TrainSchedule> trains;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonitorRequest {
        private String trainNo;          // 대상 열차번호 (예: 305)
        private String departureStation;
        private String arrivalStation;
        private String date;             // YYYYMMDD
        private String hour;             // HHmmss
        private String phoneNo;          // 예매대기 SMS 수신용 전화번호 (예: 01012345678)
        private String bookingMode;      // AUTO_ALL, RESERVE_ONLY, WAIT_ONLY
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonitorEvent {
        private String taskId;
        private String trainNo;
        private String trainType;
        private String route;
        private String departureTime;
        private String status;           // IDLE, POLLING, SUCCESS_RESERVE, SUCCESS_WAITLIST, STOPPED, ERROR
        private int attempts;
        private long lastResponseTimeMs;
        private String message;
        private String timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationResult {
        private boolean success;
        private String reservationType;  // RESERVATION(일반예약), WAITLIST(예매대기)
        private String pnrNo;            // 예약/접수 번호
        private String message;
        private String limitDate;        // 결제 기한
        private String limitTime;
    }
}
