package com.trend.backend.domain.korail;

import com.trend.backend.client.telegram.TelegramApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;

/**
 * 코레일 실시간 취소표/예매대기 백그라운드 모니터링 서비스
 * - 스마트 휴먼 지터 (2.8s ~ 4.5s) 및 마이크로 포즈 적용으로 계정 제재 원천 방어
 * - Hot 세션 상시 유지를 통한 0초 즉각 낚아채기 (Instant Booking)
 * - WebSocket STOMP (/topic/train-monitor) 실시간 이벤트 브로드캐스트
 * - 스마트폰 텔레그램 푸시 알림 연동
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KorailMonitorService {

    private final KorailClient korailClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final TelegramApiClient telegramApiClient;

    private final Map<String, MonitorTaskContext> activeTasks = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    private static class MonitorTaskContext {
        String taskId;
        KorailDto.MonitorRequest request;
        volatile boolean running = true;
        int attempts = 0;
        ScheduledFuture<?> future;
        KorailDto.MonitorEvent lastEvent;
    }

    public synchronized KorailDto.MonitorEvent startMonitoring(KorailDto.MonitorRequest request) {
        // 이미 진행 중인 모니터링이 있다면 먼저 중지
        stopAllMonitoring();

        String taskId = UUID.randomUUID().toString().substring(0, 8);
        List<String> targetTrainNos = new ArrayList<>();
        if (request.getTargetTrainNos() != null && !request.getTargetTrainNos().isEmpty()) {
            targetTrainNos.addAll(request.getTargetTrainNos());
        } else if (request.getTrainNo() != null && !request.getTrainNo().isBlank()) {
            targetTrainNos.add(request.getTrainNo());
        }
        request.setTargetTrainNos(targetTrainNos);

        String mainTrainNo = targetTrainNos.isEmpty() ? "N/A" : targetTrainNos.get(0);
        String trainSummary = targetTrainNos.size() > 1 
                ? String.format("%s 외 %d대", mainTrainNo, targetTrainNos.size() - 1)
                : mainTrainNo;

        log.info("🚅 스마트 다중 취소표/예매대기 모니터링 시작: taskId={}, 열차목록={}, 구간={}->{}, 날짜={}",
                taskId, targetTrainNos, request.getDepartureStation(), request.getArrivalStation(), request.getDate());

        MonitorTaskContext context = new MonitorTaskContext();
        context.taskId = taskId;
        context.request = request;

        KorailDto.MonitorEvent initialEvent = KorailDto.MonitorEvent.builder()
                .taskId(taskId)
                .trainNo(trainSummary)
                .targetTrainNos(targetTrainNos)
                .targetTrains(request.getTargetTrains())
                .targetTrainCount(targetTrainNos.size())
                .trainType("KTX")
                .route(request.getDepartureStation() + " ➡️ " + request.getArrivalStation())
                .departureTime(request.getHour())
                .status("POLLING")
                .attempts(0)
                .lastResponseTimeMs(0)
                .message(String.format("스마트 레이더 가동 (%d개 열차 동시 스캔) - 취소표 및 예매대기 슬롯 탐색 중...", targetTrainNos.size()))
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                .build();

        context.lastEvent = initialEvent;
        activeTasks.put(taskId, context);

        // 첫 번째 폴링 스케줄링
        scheduleNextPoll(context, 500);

        broadcastEvent(initialEvent);
        return initialEvent;
    }

    public synchronized boolean stopMonitoring(String taskId) {
        MonitorTaskContext context = activeTasks.remove(taskId);
        if (context != null) {
            context.running = false;
            if (context.future != null) {
                context.future.cancel(true);
            }
            List<String> targetNos = context.request.getTargetTrainNos();
            if (targetNos == null || targetNos.isEmpty()) {
                targetNos = context.request.getTrainNo() != null ? List.of(context.request.getTrainNo()) : List.of();
            }
            String mainTrainNo = targetNos.isEmpty() ? "N/A" : targetNos.get(0);
            String trainSummary = targetNos.size() > 1 
                    ? String.format("%s 외 %d대", mainTrainNo, targetNos.size() - 1)
                    : mainTrainNo;

            KorailDto.MonitorEvent stopEvent = KorailDto.MonitorEvent.builder()
                    .taskId(taskId)
                    .trainNo(trainSummary)
                    .targetTrainNos(targetNos)
                    .targetTrains(context.request.getTargetTrains())
                    .targetTrainCount(targetNos.size())
                    .status("STOPPED")
                    .attempts(context.attempts)
                    .message("사용자 요청으로 모니터링이 중지되었습니다.")
                    .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                    .build();
            broadcastEvent(stopEvent);
            log.info("모니터링 중지됨: taskId={}", taskId);
            return true;
        }
        return false;
    }

    public synchronized void stopAllMonitoring() {
        for (String taskId : new ArrayList<>(activeTasks.keySet())) {
            stopMonitoring(taskId);
        }
    }

    public KorailDto.MonitorEvent getCurrentStatus() {
        if (activeTasks.isEmpty()) {
            return KorailDto.MonitorEvent.builder()
                    .status("IDLE")
                    .message("현재 활성화된 모니터링 태스크가 없습니다.")
                    .build();
        }
        return activeTasks.values().iterator().next().lastEvent;
    }

    private void scheduleNextPoll(MonitorTaskContext context, long delayMs) {
        if (!context.running) return;

        context.future = scheduler.schedule(() -> {
            if (!context.running) return;
            executePoll(context);
        }, delayMs, TimeUnit.MILLISECONDS);
    }

    private void executePoll(MonitorTaskContext context) {
        if (!context.running) return;

        long startTime = System.currentTimeMillis();
        context.attempts++;

        try {
            KorailDto.SearchRequest searchReq = new KorailDto.SearchRequest(
                    context.request.getDepartureStation(),
                    context.request.getArrivalStation(),
                    context.request.getDate(),
                    context.request.getHour(),
                    "109"
            );

            if (!context.running) return;
            KorailDto.SearchResponse searchRes = korailClient.searchSchedules(searchReq);
            if (!context.running) return;
            long elapsed = System.currentTimeMillis() - startTime;

            List<String> targetNos = context.request.getTargetTrainNos();
            if (targetNos == null || targetNos.isEmpty()) {
                targetNos = List.of(context.request.getTrainNo());
            }

            List<KorailDto.TrainSchedule> matchedTargets = new ArrayList<>();
            if (searchRes.isSuccess() && searchRes.getTrains() != null) {
                for (KorailDto.TrainSchedule train : searchRes.getTrains()) {
                    if (targetNos.contains(train.getTrainNo())) {
                        matchedTargets.add(train);
                    }
                }
            }

            if (!searchRes.isSuccess()) {
                String errMsg = searchRes.getMessage();
                if (errMsg != null && (errMsg.contains("제한") || errMsg.contains("차단") || errMsg.contains("비정상") || errMsg.contains("초과"))) {
                    log.error("🚨 [계정 및 IP 보호] 운영사 보안 알림 감지, 즉시 모니터링 안전 정지: {}", errMsg);
                    context.running = false;
                    activeTasks.remove(context.taskId);
                    KorailDto.MonitorEvent safeStopEvent = KorailDto.MonitorEvent.builder()
                            .taskId(context.taskId)
                            .trainNo(context.request.getTrainNo())
                            .targetTrainNos(targetNos)
                            .targetTrainCount(targetNos.size())
                            .trainType("KTX")
                            .route(context.request.getDepartureStation() + " ➡️ " + context.request.getArrivalStation())
                            .status("STOPPED_SAFE")
                            .attempts(context.attempts)
                            .lastResponseTimeMs(elapsed)
                            .message("🚨 [안전 정지] 계정 보호를 위해 모니터링이 자동 중지되었습니다: " + errMsg)
                            .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                            .build();
                    context.lastEvent = safeStopEvent;
                    broadcastEvent(safeStopEvent);
                    return;
                }
            }

            if (matchedTargets.isEmpty()) {
                log.warn("대상 열차를 목록에서 찾을 수 없음: targetNos={}", targetNos);
                updateAndBroadcast(context, "POLLING", elapsed, "열차 목록 수신 중 (대상 번호 스캔 대기)");
                nextJitterSchedule(context);
                return;
            }

            String mode = context.request.getBookingMode() != null ? context.request.getBookingMode() : "AUTO_ALL";

            // 1) 매칭된 모든 타깃 열차 중 취소표 좌석 발견 우선 검사!
            if (!"WAIT_ONLY".equals(mode)) {
                for (KorailDto.TrainSchedule targetTrain : matchedTargets) {
                    if (targetTrain.isGeneralAvailable() || targetTrain.isSpecialAvailable()) {
                        String seatType = targetTrain.isGeneralAvailable() ? "1" : "2";
                        log.info("🚨 [취소표 감지!] {} 열차 좌석 오픈! 즉시 예약(1101) 단 0초 타격 실행!", targetTrain.getTrainNo());

                        KorailDto.ReservationResult res = korailClient.reserveSeat(targetTrain, seatType);
                        if (res.isSuccess()) {
                            context.running = false;
                            activeTasks.remove(context.taskId);
                            KorailDto.MonitorEvent successEvent = KorailDto.MonitorEvent.builder()
                                    .taskId(context.taskId)
                                    .trainNo(targetTrain.getTrainNo())
                                    .targetTrainNos(targetNos)
                                    .targetTrains(matchedTargets)
                                    .targetTrainCount(targetNos.size())
                                    .trainType(targetTrain.getTrainType())
                                    .route(targetTrain.getDepartureStation() + " ➡️ " + targetTrain.getArrivalStation())
                                    .departureTime(targetTrain.getDepartureTime())
                                    .status("SUCCESS_RESERVE")
                                    .attempts(context.attempts)
                                    .lastResponseTimeMs(elapsed)
                                    .message("🎉 축하합니다! 취소표 예약 성공! (열차: " + targetTrain.getTrainNo() + "호, 결제기한: " + res.getLimitDate() + " " + res.getLimitTime() + ", PNR: " + res.getPnrNo() + ")")
                                    .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                                    .build();
                            context.lastEvent = successEvent;
                            broadcastEvent(successEvent);
                            telegramApiClient.sendReservationAlert(targetTrain, res.getPnrNo(), res.getLimitDate(), res.getLimitTime());
                            return;
                        } else {
                            log.warn("취소표 예약 경합 실패: {}. 모니터링 지속", res.getMessage());
                            if (res.getMessage() != null && (res.getMessage().contains("제한") || res.getMessage().contains("차단") || res.getMessage().contains("비정상"))) {
                                log.error("🚨 [계정 보호] 예약 중 운영사 제한 감지, 즉시 안전 정지: {}", res.getMessage());
                                context.running = false;
                                activeTasks.remove(context.taskId);
                                updateAndBroadcast(context, "STOPPED_SAFE", elapsed, "🚨 [안전 정지] " + res.getMessage());
                                return;
                            }
                        }
                    }
                }
            }

            // 2) 매칭된 모든 타깃 열차 중 예매대기(Waitlist) 신청 가능 발견 검사!
            if (!"RESERVE_ONLY".equals(mode)) {
                for (KorailDto.TrainSchedule targetTrain : matchedTargets) {
                    if (targetTrain.isWaitAvailable()) {
                        log.info("🚨 [예매대기 가능 감지!] {} 열차 예매대기(1102) 신청 즉시 실행!", targetTrain.getTrainNo());

                        KorailDto.ReservationResult waitRes = korailClient.reserveWaitlist(targetTrain, context.request.getPhoneNo(), false);
                        if (waitRes.isSuccess()) {
                            context.running = false;
                            activeTasks.remove(context.taskId);
                            KorailDto.MonitorEvent waitSuccessEvent = KorailDto.MonitorEvent.builder()
                                    .taskId(context.taskId)
                                    .trainNo(targetTrain.getTrainNo())
                                    .targetTrainNos(targetNos)
                                    .targetTrains(matchedTargets)
                                    .targetTrainCount(targetNos.size())
                                    .trainType(targetTrain.getTrainType())
                                    .route(targetTrain.getDepartureStation() + " ➡️ " + targetTrain.getArrivalStation())
                                    .departureTime(targetTrain.getDepartureTime())
                                    .status("SUCCESS_WAITLIST")
                                    .attempts(context.attempts)
                                    .lastResponseTimeMs(elapsed)
                                    .message("🎉 예매대기 신청 성공! (열차: " + targetTrain.getTrainNo() + "호, 접수번호: " + waitRes.getPnrNo() + ")")
                                    .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                                    .build();
                            context.lastEvent = waitSuccessEvent;
                            broadcastEvent(waitSuccessEvent);
                            telegramApiClient.sendWaitlistAlert(targetTrain, waitRes.getPnrNo(), waitRes.getMessage());
                            return;
                        } else {
                            log.warn("예매대기 등록 경합 실패: {}. 모니터링 지속", waitRes.getMessage());
                            if (waitRes.getMessage() != null && (waitRes.getMessage().contains("제한") || waitRes.getMessage().contains("차단") || waitRes.getMessage().contains("비정상"))) {
                                log.error("🚨 [계정 보호] 예매대기 중 운영사 제한 감지, 즉시 안전 정지: {}", waitRes.getMessage());
                                context.running = false;
                                activeTasks.remove(context.taskId);
                                updateAndBroadcast(context, "STOPPED_SAFE", elapsed, "🚨 [안전 정지] " + waitRes.getMessage());
                                return;
                            }
                        }
                    }
                }
            }

            // 아직 어떤 타깃 열차도 자리가 나지 않은 상태 -> 최신 상태 업데이트 및 브로드캐스트
            context.request.setTargetTrains(matchedTargets);
            String statusMsg = String.format("다중 레이더 탐색 중 (%d회 시도, %dms, %d개 열차 감시 중)",
                    context.attempts, elapsed, targetNos.size());

            updateAndBroadcast(context, "POLLING", elapsed, statusMsg);
            nextJitterSchedule(context);

        } catch (Exception e) {
            log.error("모니터링 폴링 중 오류: {}", e.getMessage());
            if (context.running) {
                updateAndBroadcast(context, "POLLING", 0, "조회 일시 지연: " + e.getMessage());
                nextJitterSchedule(context);
            }
        }
    }

    private void nextJitterSchedule(MonitorTaskContext context) {
        if (!context.running) return;

        // 인간형 가우시안 랜덤 지터: 2800ms ~ 4500ms
        long jitterDelay = ThreadLocalRandom.current().nextLong(2800, 4500);

        // 30회 주기마다 2초 추가 마이크로 쉼표 (사람이 화면 쳐다보는 시간 모사)
        if (context.attempts % 30 == 0) {
            jitterDelay += 2000;
            log.debug("안티-디텍션 마이크로 포즈 적용 (추가 2초)");
        }

        scheduleNextPoll(context, jitterDelay);
    }

    private void updateAndBroadcast(MonitorTaskContext context, String status, long elapsed, String message) {
        if (!context.running && !"STOPPED".equals(status) && !"STOPPED_SAFE".equals(status)) {
            return;
        }

        List<String> targetNos = context.request.getTargetTrainNos();
        if (targetNos == null || targetNos.isEmpty()) {
            targetNos = context.request.getTrainNo() != null ? List.of(context.request.getTrainNo()) : List.of();
        }

        String mainTrainNo = targetNos.isEmpty() ? "N/A" : targetNos.get(0);
        String trainSummary = targetNos.size() > 1 
                ? String.format("%s 외 %d대", mainTrainNo, targetNos.size() - 1)
                : mainTrainNo;

        KorailDto.MonitorEvent event = KorailDto.MonitorEvent.builder()
                .taskId(context.taskId)
                .trainNo(trainSummary)
                .targetTrainNos(targetNos)
                .targetTrains(context.request.getTargetTrains())
                .targetTrainCount(targetNos.size())
                .trainType("KTX")
                .route(context.request.getDepartureStation() + " ➡️ " + context.request.getArrivalStation())
                .departureTime(context.request.getHour())
                .status(status)
                .attempts(context.attempts)
                .lastResponseTimeMs(elapsed)
                .message(message)
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                .build();

        context.lastEvent = event;
        broadcastEvent(event);
    }

    private void broadcastEvent(KorailDto.MonitorEvent event) {
        try {
            messagingTemplate.convertAndSend("/topic/train-monitor", event);
        } catch (Exception e) {
            log.debug("웹소켓 전송 예외 (클라이언트 미연결 시 정상): {}", e.getMessage());
        }
    }
}
