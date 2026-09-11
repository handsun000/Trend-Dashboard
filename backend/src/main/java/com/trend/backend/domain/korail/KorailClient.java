package com.trend.backend.domain.korail;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.client.config.ExternalApiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 코레일 공식 모바일 100% 라이브 통신 클라이언트 (Python Bridge Engine 연동)
 * - 철도 운영사 4대 방어 기제 준수 (WAF/Rate Limiting 스마트 지터, Dalvik UA, 패킷 암호화, DynaPath 토큰, 2-Step 정규 트랜잭션)
 * - 절대 원칙: 가짜 세션/모의 데이터 일체 배제, 오류 투명성 100% 보장
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KorailClient implements ExternalApiClient {

    private final KorailStationRegistry stationRegistry;
    private final ObjectMapper objectMapper;
    private final ExternalApiProperties.KorailProperties korailProperties;

    private static final String DEFAULT_BRIDGE_SCRIPT = "backend/src/main/resources/korail_bridge.py";

    private String resolveBridgeScript() {
        String[] candidatePaths = {
            DEFAULT_BRIDGE_SCRIPT,
            "src/main/resources/korail_bridge.py",
            "korail_bridge.py",
            "/app/korail_bridge.py"
        };
        for (String path : candidatePaths) {
            if (new java.io.File(path).exists()) {
                return path;
            }
        }
        return DEFAULT_BRIDGE_SCRIPT;
    }

    private volatile KorailDto.LoginSession currentSession = null;

    @Override
    public String getProviderName() {
        return "KORAIL";
    }

    @Override
    public boolean isConfigured() {
        return korailProperties.isConfigured() || (currentSession != null && currentSession.isLoggedIn());
    }

    @Override
    public ExternalApiHealth checkHealth() {
        if (currentSession != null && currentSession.isLoggedIn()) {
            return ExternalApiHealth.healthy("KORAIL", "코레일 실서버 라이브 세션 활성화됨 (회원: " + currentSession.getCustomerName() + ")", 0);
        }
        if (korailProperties.isConfigured()) {
            return ExternalApiHealth.degraded("KORAIL", "비밀키/계정 설정 완료, 모바일 세션 핫 연결 대기 중", 0);
        }
        return ExternalApiHealth.unconfigured("KORAIL", "코레일 회원번호/비밀번호 미설정 (로그인 모달을 통해 직접 연결 가능)");
    }


    /**
     * 파이썬 모바일 통신 브릿지 커맨드 실행 엔진
     */
    private String runBridge(String... args) throws Exception {
        List<String> cmd = new ArrayList<>();
        cmd.add("python");
        cmd.add(resolveBridgeScript());
        cmd.addAll(Arrays.asList(args));

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        process.waitFor();
        return sb.toString().trim();
    }

    /**
     * 코레일 회원번호 및 비밀번호 기반 모바일 실서버 로그인
     * (절대 원칙 준수: 가짜 세션 fallback 영구 제거, 실패 시 실서버 에러 메시지 투명 반환)
     */
    public synchronized KorailDto.LoginSession login(String memberNo, String password) {
        try {
            if (memberNo == null || memberNo.isBlank()) {
                memberNo = korailProperties.getMemberNo();
            }
            if (password == null || password.isBlank()) {
                password = korailProperties.getPassword();
            }

            log.info("코레일 모바일 실서버 로그인 시도: 회원번호={}", memberNo);

            String responseJson = runBridge("login", memberNo, password);
            JsonNode rootNode = objectMapper.readTree(responseJson);

            boolean success = rootNode.path("success").asBoolean(false);
            boolean loggedIn = rootNode.path("loggedIn").asBoolean(false);

            if (success && loggedIn) {
                String customerName = rootNode.path("customerName").asText("회원");
                String customerNo = rootNode.path("customerNo").asText("");
                String mbCrdNo = rootNode.path("memberNo").asText(memberNo);
                String mobileKey = rootNode.path("key").asText("");
                String phoneNo = rootNode.path("phoneNo").asText(korailProperties.getPhoneNo());


                this.currentSession = KorailDto.LoginSession.builder()
                        .loggedIn(true)
                        .memberNo(mbCrdNo)
                        .customerName(customerName)
                        .customerNo(customerNo)
                        .key(mobileKey)
                        .phoneNo(phoneNo)
                        .message("코레일 실서버 로그인 성공")
                        .build();

                log.info("🎉 코레일 실서버 100% 라이브 로그인 성공! 회원명: {}, 회원번호: {}, 고객번호: {}", customerName, mbCrdNo, customerNo);
                return this.currentSession;
            } else {
                String errorMsg = rootNode.path("message").asText("코레일 로그인에 실패하였습니다.");
                log.warn("코레일 실서버 로그인 거절/실패: {}", errorMsg);

                this.currentSession = KorailDto.LoginSession.builder()
                        .loggedIn(false)
                        .message(errorMsg)
                        .build();
                return this.currentSession;
            }
        } catch (Exception e) {
            log.error("코레일 로그인 중 통신 예외 발생: {}", e.getMessage(), e);
            this.currentSession = KorailDto.LoginSession.builder()
                    .loggedIn(false)
                    .message("로그인 통신 오류: " + e.getMessage())
                    .build();
            return this.currentSession;
        }
    }

    /**
     * 현재 로그인 세션 상태 조회 (디스크 세션 자동 복구 지원)
     */
    public synchronized KorailDto.LoginSession getCurrentSession() {
        if (this.currentSession != null && this.currentSession.isLoggedIn()) {
            return this.currentSession;
        }

        try {
            String resp = runBridge("session");
            JsonNode rootNode = objectMapper.readTree(resp);
            if (rootNode.path("loggedIn").asBoolean(false)) {
                this.currentSession = KorailDto.LoginSession.builder()
                        .loggedIn(true)
                        .memberNo(rootNode.path("memberNo").asText(""))
                        .customerName(rootNode.path("customerName").asText("회원"))
                        .customerNo(rootNode.path("customerNo").asText(""))
                        .key(rootNode.path("key").asText(""))
                        .phoneNo(rootNode.path("phoneNo").asText(korailProperties.getPhoneNo()))
                        .message("코레일 실서버 활성 세션")
                        .build();
                return this.currentSession;
            }
        } catch (Exception e) {
            log.debug("디스크 세션 확인 중 예외: {}", e.getMessage());
        }

        // 디스크 세션이 없거나 비활성이더라도 설정 파일에 계정이 등록되어 있다면 자동 핫 로그인 복구
        if (korailProperties.isConfigured()) {
            log.info("코레일 활성 세션 없음 -> application-secret 등록 계정으로 자동 핫 로그인 복구 실행");
            return login(korailProperties.getMemberNo(), korailProperties.getPassword());
        }

        return KorailDto.LoginSession.builder()
                .loggedIn(false)
                .message("로그인된 코레일 세션이 없습니다.")
                .build();
    }


    /**
     * 열차 실시간 운행 및 좌석/예매대기 현황 조회 (ScheduleView)
     */
    public KorailDto.SearchResponse searchSchedules(KorailDto.SearchRequest request) {
        try {
            String depCode = stationRegistry.getCode(request.getDepartureStation());
            String arrCode = stationRegistry.getCode(request.getArrivalStation());
            String depName = stationRegistry.getName(depCode != null ? depCode : request.getDepartureStation());
            String arrName = stationRegistry.getName(arrCode != null ? arrCode : request.getArrivalStation());

            if (depCode == null) depCode = "0001"; // 기본 서울
            if (arrCode == null) arrCode = "0020"; // 기본 부산

            String date = request.getDate();
            if (date == null || date.isBlank()) {
                date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            }

            String hour = request.getHour();
            if (hour == null || hour.isBlank()) {
                hour = "000000";
            }
            if (hour.length() == 2) {
                hour = hour + "0000";
            }

            String trainGroup = request.getTrainGroup();
            if (trainGroup == null || trainGroup.isBlank()) {
                trainGroup = "109"; // 109: 전체 (KTX/SRT 포함)
            }

            String responseBody = runBridge("search", depName, arrName, date, hour, trainGroup);

            if (responseBody != null && responseBody.contains("\"strResult\"")) {
                JsonNode rootNode = objectMapper.readTree(responseBody);
                if ("SUCC".equalsIgnoreCase(rootNode.path("strResult").asText())) {
                    JsonNode trnInfoArray = rootNode.path("trn_infos").path("trn_info");
                    List<KorailDto.TrainSchedule> schedules = new ArrayList<>();
                    if (trnInfoArray.isArray()) {
                        for (JsonNode node : trnInfoArray) {
                            schedules.add(parseTrainSchedule(node));
                        }
                    } else if (trnInfoArray.isObject()) {
                        schedules.add(parseTrainSchedule(trnInfoArray));
                    }
                    if (!schedules.isEmpty()) {
                        log.info("🎉 코레일 실서버 100% 실시간 라이브 데이터 수신 성공! 총 {}개 열차", schedules.size());
                        return new KorailDto.SearchResponse(true, "코레일 실서버 실시간 열차 정보가 정상 조회되었습니다.", schedules.size(), schedules);
                    }
                } else {
                    String msg = rootNode.path("h_msg_txt").asText("조회된 열차가 없습니다.");
                    log.warn("코레일 실서버 응답: {}", msg);
                    return new KorailDto.SearchResponse(false, msg, 0, Collections.emptyList());
                }
            }

            return new KorailDto.SearchResponse(false, "코레일 실서버와 통신할 수 없습니다.", 0, Collections.emptyList());
        } catch (Exception e) {
            log.error("코레일 열차 조회 중 예외 발생: {}", e.getMessage(), e);
            return new KorailDto.SearchResponse(false, "열차 조회 처리 중 오류가 발생했습니다: " + e.getMessage(), 0, Collections.emptyList());
        }
    }

    /**
     * 일반 좌석 즉시 예약 (TicketReservation JobId 1101)
     */
    public KorailDto.ReservationResult reserveSeat(KorailDto.TrainSchedule train, String seatType) {
        KorailDto.LoginSession session = getCurrentSession();
        if (session == null || !session.isLoggedIn()) {
            return KorailDto.ReservationResult.builder()
                    .success(false)
                    .message("로그인 세션이 없습니다. 먼저 코레일 실서버 로그인을 진행해 주세요.")
                    .build();
        }

        try {
            log.info("취소표 즉시 예약(1101) 실서버 시도: 열차={}, 좌석구분={}", train.getTrainNo(), seatType);
            String trainJson = objectMapper.writeValueAsString(train);
            String trainJsonBase64 = Base64.getEncoder().encodeToString(trainJson.getBytes(StandardCharsets.UTF_8));

            String responseStr = runBridge("reserve", trainJsonBase64, seatType != null ? seatType : "1");
            JsonNode json = objectMapper.readTree(responseStr);

            boolean success = json.path("success").asBoolean(false);
            String msg = json.path("message").asText("");
            String pnrNo = json.path("pnrNo").asText("");
            String limitDate = json.path("limitDate").asText("");
            String limitTime = json.path("limitTime").asText("");

            // 코레일 실서버 세션 만료(P058) 감지 시 투명 자동 재로그인 및 1회 재시도
            if (!success && (msg.contains("P058") || msg.contains("로그아웃") || msg.contains("세션"))) {
                log.warn("코레일 실서버 세션 만료(P058) 감지! 등록 계정으로 즉시 자동 핫 로그인 및 예약 재시도...");
                this.currentSession = null;
                if (korailProperties.isConfigured()) {
                    KorailDto.LoginSession reSession = login(korailProperties.getMemberNo(), korailProperties.getPassword());
                    if (reSession != null && reSession.isLoggedIn()) {
                        log.info("자동 재로그인 성공 -> 좌석 예약(1101) 1회 즉시 재시도");
                        responseStr = runBridge("reserve", trainJsonBase64, seatType != null ? seatType : "1");
                        json = objectMapper.readTree(responseStr);
                        success = json.path("success").asBoolean(false);
                        msg = json.path("message").asText("");
                        pnrNo = json.path("pnrNo").asText("");
                        limitDate = json.path("limitDate").asText("");
                        limitTime = json.path("limitTime").asText("");
                    }
                }
            }

            if (success) {
                log.info("🎉 실서버 취소표 예약 성공! PNR: {}, 결제기한: {} {}", pnrNo, limitDate, limitTime);
                return KorailDto.ReservationResult.builder()
                        .success(true)
                        .reservationType("RESERVATION")
                        .pnrNo(pnrNo)
                        .limitDate(limitDate)
                        .limitTime(limitTime)
                        .message(msg)
                        .build();
            } else {
                log.warn("코레일 실서버 취소표 예약 실패: {}", msg);
                return KorailDto.ReservationResult.builder()
                        .success(false)
                        .message(msg)
                        .build();
            }
        } catch (Exception e) {
            log.error("취소표 예약 중 오류 발생: {}", e.getMessage(), e);
            return KorailDto.ReservationResult.builder()
                    .success(false)
                    .message("예약 요청 처리 중 오류: " + e.getMessage())
                    .build();
        }
    }

    /**
     * 예매대기 신청 (TicketReservation JobId 1102 ➡️ ReservationWait 2-Step 정규 파이프라인)
     */
    public KorailDto.ReservationResult reserveWaitlist(KorailDto.TrainSchedule train, String phoneNo) {
        return reserveWaitlist(train, phoneNo, false);
    }

    public KorailDto.ReservationResult reserveWaitlist(KorailDto.TrainSchedule train, String phoneNo, boolean includeSpecial) {
        KorailDto.LoginSession session = getCurrentSession();
        if (session == null || !session.isLoggedIn()) {
            return KorailDto.ReservationResult.builder()
                    .success(false)
                    .message("로그인 세션이 없습니다. 먼저 코레일 실서버 로그인을 진행해 주세요.")
                    .build();
        }

        try {
            String targetPhone = (phoneNo != null && !phoneNo.isBlank()) ? phoneNo : session.getPhoneNo();
            if (targetPhone == null || targetPhone.isBlank()) {
                targetPhone = korailProperties.getPhoneNo();
            }

            String specialFlag = includeSpecial ? "Y" : "N";
            log.info("예매대기 신청 실서버 시도: 열차={}, 전화번호={}, 특실포함={}", train.getTrainNo(), targetPhone, specialFlag);
            String trainJson = objectMapper.writeValueAsString(train);
            String trainJsonBase64 = Base64.getEncoder().encodeToString(trainJson.getBytes(StandardCharsets.UTF_8));

            String responseStr = runBridge("waitlist", trainJsonBase64, targetPhone, specialFlag);
            JsonNode json = objectMapper.readTree(responseStr);

            boolean success = json.path("success").asBoolean(false);
            String msg = json.path("message").asText("");
            String pnrNo = json.path("pnrNo").asText("");

            // 코레일 실서버 세션 만료(P058) 감지 시 투명 자동 재로그인 및 1회 재시도
            if (!success && (msg.contains("P058") || msg.contains("로그아웃") || msg.contains("세션"))) {
                log.warn("코레일 실서버 세션 만료(P058) 감지! 등록 계정으로 즉시 자동 핫 로그인 및 예매대기 재시도...");
                this.currentSession = null;
                if (korailProperties.isConfigured()) {
                    KorailDto.LoginSession reSession = login(korailProperties.getMemberNo(), korailProperties.getPassword());
                    if (reSession != null && reSession.isLoggedIn()) {
                        log.info("자동 재로그인 성공 -> 예매대기(1102) 1회 즉시 재시도");
                        responseStr = runBridge("waitlist", trainJsonBase64, targetPhone, specialFlag);
                        json = objectMapper.readTree(responseStr);
                        success = json.path("success").asBoolean(false);
                        msg = json.path("message").asText("");
                        pnrNo = json.path("pnrNo").asText("");
                    }
                }
            }

            if (success) {
                log.info("🎉 실서버 예매대기 신청 최종 성공! PNR: {}", pnrNo);
                return KorailDto.ReservationResult.builder()
                        .success(true)
                        .reservationType("WAITLIST")
                        .pnrNo(pnrNo)
                        .message(msg)
                        .build();
            } else {
                log.warn("코레일 실서버 예매대기 신청 실패: {}", msg);
                return KorailDto.ReservationResult.builder()
                        .success(false)
                        .message(msg)
                        .build();
            }
        } catch (Exception e) {
            log.error("예매대기 신청 중 오류: {}", e.getMessage(), e);
            return KorailDto.ReservationResult.builder()
                    .success(false)
                    .message("예매대기 처리 중 오류: " + e.getMessage())
                    .build();
        }
    }

    private KorailDto.TrainSchedule parseTrainSchedule(JsonNode node) {
        String trnNo = node.path("h_trn_no").asText("");
        String trnType = node.path("h_trn_clsf_nm").asText("KTX");
        String dptStn = node.path("h_dpt_rs_stn_nm").asText("");
        String dptStnCd = node.path("h_dpt_rs_stn_cd").asText("");
        String dptDt = node.path("h_dpt_dt").asText("");
        String dptTmQb = node.path("h_dpt_tm_qb").asText("");
        String dptTmRaw = node.path("h_dpt_tm").asText("");
        String arvStn = node.path("h_arv_rs_stn_nm").asText("");
        String arvStnCd = node.path("h_arv_rs_stn_cd").asText("");
        String arvTmQb = node.path("h_arv_tm_qb").asText("");
        String arvTmRaw = node.path("h_arv_tm").asText("");
        String runTm = node.path("h_run_tm").asText("");

        // 0236 -> 02:36 포맷
        if (runTm.length() == 4) {
            runTm = runTm.substring(0, 2) + "시간 " + runTm.substring(2) + "분";
        }

        int price = 0;
        try {
            price = Integer.parseInt(node.path("h_rcvd_amt").asText("0"));
        } catch (Exception ignored) {}

        String genRsvCd = node.path("h_gen_rsv_cd").asText("");
        String genRsvNm = node.path("h_gen_rsv_nm").asText("매진");
        boolean isGenAvailable = "11".equals(genRsvCd);

        String speRsvCd = node.path("h_spe_rsv_cd").asText("");
        String speRsvNm = node.path("h_spe_rsv_nm").asText("매진");
        boolean isSpeAvailable = "11".equals(speRsvCd);

        String waitRsvFlg = node.path("h_wait_rsv_flg").asText("").trim();
        boolean isWaitAvailable = "9".equals(waitRsvFlg);

        int waitQueue = 0;
        try {
            waitQueue = Integer.parseInt(node.path("h_rsv_wait_ps_cnt").asText("0"));
        } catch (Exception ignored) {}

        return KorailDto.TrainSchedule.builder()
                .trainNo(trnNo)
                .trainType(trnType)
                .departureStation(dptStn)
                .departureStationCode(dptStnCd)
                .departureDate(dptDt)
                .departureTime(dptTmQb)
                .departureTimeRaw(dptTmRaw)
                .arrivalStation(arvStn)
                .arrivalStationCode(arvStnCd)
                .arrivalTime(arvTmQb)
                .arrivalTimeRaw(arvTmRaw)
                .runTime(runTm)
                .price(price)
                .generalSeatStatus(genRsvNm)
                .generalAvailable(isGenAvailable)
                .specialSeatStatus(speRsvNm)
                .specialAvailable(isSpeAvailable)
                .waitAvailable(isWaitAvailable)
                .waitQueueCount(waitQueue)
                .runDate(node.path("h_run_dt").asText(dptDt))
                .trainGroupCode(node.path("h_trn_gp_cd").asText("100"))
                .trainClassCode(node.path("h_trn_clsf_cd").asText("00"))
                .build();
    }
}
