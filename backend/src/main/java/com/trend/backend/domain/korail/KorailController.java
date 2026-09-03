package com.trend.backend.domain.korail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 코레일 KTX/SRT 실시간 조회, 로그인, 모니터링 REST API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/korail")
@RequiredArgsConstructor
public class KorailController {

    private final KorailClient korailClient;
    private final KorailMonitorService monitorService;
    private final KorailStationRegistry stationRegistry;

    /**
     * 1. 코레일 모바일 세션 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<KorailDto.LoginSession> login(@RequestBody KorailDto.LoginRequest request) {
        log.info("REST 요청: 코레일 로그인 회원번호={}", request.getMemberNo());
        KorailDto.LoginSession session = korailClient.login(request.getMemberNo(), request.getPassword());
        return ResponseEntity.ok(session);
    }

    /**
     * 2. 현재 로그인 세션 상태 조회
     */
    @GetMapping("/session")
    public ResponseEntity<KorailDto.LoginSession> getSession() {
        KorailDto.LoginSession session = korailClient.getCurrentSession();
        if (session == null) {
            session = KorailDto.LoginSession.builder()
                    .loggedIn(false)
                    .message("로그인된 코레일 세션이 없습니다.")
                    .build();
        }
        return ResponseEntity.ok(session);
    }

    /**
     * 3. 전국 주요 역 목록 조회
     */
    @GetMapping("/stations")
    public ResponseEntity<Map<String, Object>> getStations() {
        List<KorailStationRegistry.Station> all = stationRegistry.getAllStations();
        List<KorailStationRegistry.Station> major = stationRegistry.getMajorStations();
        return ResponseEntity.ok(Map.of(
                "majorStations", major,
                "allStations", all
        ));
    }

    /**
     * 4. 실시간 열차 운행 및 좌석/대기 현황 조회
     */
    @GetMapping("/search")
    public ResponseEntity<KorailDto.SearchResponse> search(
            @RequestParam(defaultValue = "수서") String departureStation,
            @RequestParam(defaultValue = "부산") String arrivalStation,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "000000") String hour,
            @RequestParam(defaultValue = "109") String trainGroup) {

        KorailDto.SearchRequest request = new KorailDto.SearchRequest(departureStation, arrivalStation, date, hour, trainGroup);
        KorailDto.SearchResponse response = korailClient.searchSchedules(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. 수동 즉시 좌석 예약 (1101)
     */
    @PostMapping("/reserve")
    public ResponseEntity<KorailDto.ReservationResult> reserve(
            @RequestBody KorailDto.TrainSchedule train,
            @RequestParam(defaultValue = "1") String seatType) {
        KorailDto.ReservationResult result = korailClient.reserveSeat(train, seatType);
        return ResponseEntity.ok(result);
    }

    /**
     * 6. 수동 즉시 예매대기 신청 (1102 ➡️ ReservationWait)
     */
    @PostMapping("/reserve-wait")
    public ResponseEntity<KorailDto.ReservationResult> reserveWait(
            @RequestBody KorailDto.TrainSchedule train,
            @RequestParam(required = false) String phoneNo) {
        KorailDto.ReservationResult result = korailClient.reserveWaitlist(train, phoneNo);
        return ResponseEntity.ok(result);
    }

    /**
     * 7. 스텔스 취소표/예매대기 자동 사냥(모니터링) 시작
     */
    @PostMapping("/monitor/start")
    public ResponseEntity<KorailDto.MonitorEvent> startMonitor(@RequestBody KorailDto.MonitorRequest request) {
        KorailDto.MonitorEvent event = monitorService.startMonitoring(request);
        return ResponseEntity.ok(event);
    }

    /**
     * 8. 모니터링 중지
     */
    @PostMapping("/monitor/stop")
    public ResponseEntity<Map<String, Object>> stopMonitor(@RequestParam(required = false) String taskId) {
        if (taskId != null && !taskId.isBlank()) {
            boolean stopped = monitorService.stopMonitoring(taskId);
            return ResponseEntity.ok(Map.of("success", stopped, "message", "모니터링이 중지되었습니다."));
        } else {
            monitorService.stopAllMonitoring();
            return ResponseEntity.ok(Map.of("success", true, "message", "모든 모니터링이 중지되었습니다."));
        }
    }

    /**
     * 9. 현재 모니터링 상태 조회
     */
    @GetMapping("/monitor/status")
    public ResponseEntity<KorailDto.MonitorEvent> getMonitorStatus() {
        return ResponseEntity.ok(monitorService.getCurrentStatus());
    }
}
