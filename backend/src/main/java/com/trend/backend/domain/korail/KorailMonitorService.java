package com.trend.backend.domain.korail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * 코레일 실시간 취소표/예매대기 백그라운드 모니터링 서비스
 * - 스마트 휴먼 지터 (2.8s ~ 4.5s) 및 마이크로 포즈 적용으로 계정 제재 원천 방어
 * - Hot 세션 상시 유지를 통한 0초 즉각 낚아채기 (Instant Booking)
 * - WebSocket STOMP (/topic/train-monitor) 실시간 이벤트 브로드캐스트
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KorailMonitorService {

    private final KorailClient korailClient;
    private final SimpMessagingTemplate messagingTemplate;

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
        log.info("🚅 취소표/예매대기 모니터링 시작: taskId={}, 열차번호={}, 구간={}->{}, 날짜={}",
                taskId, request.getTrainNo(), request.getDepartureStation(), request.getArrivalStation(), request.getDate());

        MonitorTaskContext context = new MonitorTaskContext();
        context.taskId = taskId;
        context.request = request;

        KorailDto.MonitorEvent initialEvent = KorailDto.MonitorEvent.builder()
                .taskId(taskId)
                .trainNo(request.getTrainNo())
                .trainType("KTX")
                .route(request.getDepartureStation() + " ➡️ " + request.getArrivalStation())
                .departureTime(request.getHour())
                .status("POLLING")
                .attempts(0)
                .lastResponseTimeMs(0)
                .message("모니터링 레이더 활성화 - 취소표 및 예매대기 탐색 중...")
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
            KorailDto.MonitorEvent stopEvent = KorailDto.MonitorEvent.builder()
                    .taskId(taskId)
                    .trainNo(context.request.getTrainNo())
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
        for (String taskId : activeTasks.keySet()) {
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

            KorailDto.SearchResponse searchRes = korailClient.searchSchedules(searchReq);
            long elapsed = System.currentTimeMillis() - startTime;

            KorailDto.TrainSchedule targetTrain = null;
            if (searchRes.isSuccess() && searchRes.getTrains() != null) {
                for (KorailDto.TrainSchedule train : searchRes.getTrains()) {
                    if (train.getTrainNo().equals(context.request.getTrainNo())) {
                        targetTrain = train;
                        break;
                    }
                }
            }

            if (targetTrain == null) {
                log.warn("대상 열차를 찾을 수 없음: trnNo={}", context.request.getTrainNo());
                updateAndBroadcast(context, "POLLING", elapsed, "열차 목록 수신 중 (대상 번호 탐색 대기)");
                nextJitterSchedule(context);
                return;
            }

            String mode = context.request.getBookingMode() != null ? context.request.getBookingMode() : "AUTO_ALL";

            // 1) 일반실/특실 취소표 발생 감지!
            if (!"WAIT_ONLY".equals(mode) && (targetTrain.isGeneralAvailable() || targetTrain.isSpecialAvailable())) {
                String seatType = targetTrain.isGeneralAvailable() ? "1" : "2";
                log.info("🚨 [취소표 감지!] {} 열차 좌석 오픈! 즉시 예약(1101) 단 0초 타격 실행!", targetTrain.getTrainNo());

                KorailDto.ReservationResult res = korailClient.reserveSeat(targetTrain, seatType);
                if (res.isSuccess()) {
                    context.running = false;
                    activeTasks.remove(context.taskId);
                    KorailDto.MonitorEvent successEvent = KorailDto.MonitorEvent.builder()
                            .taskId(context.taskId)
                            .trainNo(targetTrain.getTrainNo())
                            .trainType(targetTrain.getTrainType())
                            .route(targetTrain.getDepartureStation() + " ➡️ " + targetTrain.getArrivalStation())
                            .departureTime(targetTrain.getDepartureTime())
                            .status("SUCCESS_RESERVE")
                            .attempts(context.attempts)
                            .lastResponseTimeMs(elapsed)
                            .message("🎉 축하합니다! 취소표 예약 성공! (결제기한: " + res.getLimitDate() + " " + res.getLimitTime() + ", PNR: " + res.getPnrNo() + ")")
                            .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                            .build();
                    context.lastEvent = successEvent;
                    broadcastEvent(successEvent);
                    return;
                } else {
                    log.warn("취소표 예약 경합 실패: {}. 모니터링 지속", res.getMessage());
                }
            }

            // 2) 예매대기(Waitlist) 신청 가능 감지!
            if (!"RESERVE_ONLY".equals(mode) && targetTrain.isWaitAvailable()) {
                log.info("🚨 [예매대기 가능 감지!] {} 열차 예매대기(1102) 신청 즉시 실행!", targetTrain.getTrainNo());

                KorailDto.ReservationResult waitRes = korailClient.reserveWaitlist(targetTrain, context.request.getPhoneNo());
                if (waitRes.isSuccess()) {
                    context.running = false;
                    activeTasks.remove(context.taskId);
                    KorailDto.MonitorEvent waitSuccessEvent = KorailDto.MonitorEvent.builder()
                            .taskId(context.taskId)
                            .trainNo(targetTrain.getTrainNo())
                            .trainType(targetTrain.getTrainType())
                            .route(targetTrain.getDepartureStation() + " ➡️ " + targetTrain.getArrivalStation())
                            .departureTime(targetTrain.getDepartureTime())
                            .status("SUCCESS_WAITLIST")
                            .attempts(context.attempts)
                            .lastResponseTimeMs(elapsed)
                            .message("🎉 예매대기 신청 성공! 취소표 발생 시 코레일 SMS로 자동 알림됩니다. (접수번호: " + waitRes.getPnrNo() + ")")
                            .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                            .build();
                    context.lastEvent = waitSuccessEvent;
                    broadcastEvent(waitSuccessEvent);
                    return;
                } else {
                    log.warn("예매대기 등록 경합 실패: {}. 모니터링 지속", waitRes.getMessage());
                }
            }

            // 아직 좌석이나 대기가 없는 상태 -> 진행 상황 브로드캐스트
            String statusMsg = String.format("탐색 중 (%d회 시도, %dms) - 일반실:%s, 특실:%s, 예매대기:%s(잔여%d명)",
                    context.attempts, elapsed,
                    targetTrain.getGeneralSeatStatus(),
                    targetTrain.getSpecialSeatStatus(),
                    targetTrain.isWaitAvailable() ? "신청가능" : "마감",
                    targetTrain.getWaitQueueCount());

            updateAndBroadcast(context, "POLLING", elapsed, statusMsg);
            nextJitterSchedule(context);

        } catch (Exception e) {
            log.error("모니터링 폴링 중 오류: {}", e.getMessage());
            updateAndBroadcast(context, "POLLING", 0, "조회 일시 지연: " + e.getMessage());
            nextJitterSchedule(context);
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
        KorailDto.MonitorEvent event = KorailDto.MonitorEvent.builder()
                .taskId(context.taskId)
                .trainNo(context.request.getTrainNo())
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
