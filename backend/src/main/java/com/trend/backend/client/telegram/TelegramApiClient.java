package com.trend.backend.client.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.client.config.ExternalApiProperties;
import com.trend.backend.domain.korail.KorailDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * 텔레그램 메신저 봇 알림 클라이언트
 * - 취소표 즉시 예약(결제대기) 및 예매대기 정규 등록 시 사용자의 스마트폰 텔레그램 앱으로 실시간 푸시 발송
 * - 코레일 예약 트랜잭션의 안정성을 해치지 않도록 철저한 Fail-Safe 예외 격리 적용
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TelegramApiClient implements ExternalApiClient {

    private final ExternalApiProperties.TelegramProperties telegramProperties;
    private final RestClient defaultRestClient;

    @Override
    public String getProviderName() {
        return "TELEGRAM";
    }

    @Override
    public boolean isConfigured() {
        return telegramProperties.isConfigured();
    }

    @Override
    public ExternalApiHealth checkHealth() {
        if (!isConfigured()) {
            return ExternalApiHealth.unconfigured("TELEGRAM", "Telegram Bot Token 또는 Chat ID 미설정");
        }
        long start = System.currentTimeMillis();
        try {
            String url = String.format("https://api.telegram.org/bot%s/getMe", telegramProperties.getBotToken());
            JsonNode res = defaultRestClient.get()
                    .uri(url)
                    .retrieve()
                    .body(JsonNode.class);

            long latency = System.currentTimeMillis() - start;
            if (res != null && res.path("ok").asBoolean(false)) {
                String botUsername = res.path("result").path("username").asText("");
                return ExternalApiHealth.healthy("TELEGRAM", "Telegram 봇 정상 연동 (@" + botUsername + ")", latency);
            } else {
                return ExternalApiHealth.degraded("TELEGRAM", "Telegram API 응답 비정상", latency);
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            log.warn("Telegram health check 실패: {}", e.getMessage());
            return ExternalApiHealth.degraded("TELEGRAM", "Telegram 헬스체크 실패: " + e.getMessage(), latency);
        }
    }

    /**
     * 기본 텍스트 메시지 발송 (Fail-safe)
     */
    public boolean sendTextMessage(String text) {
        if (!isConfigured()) {
            log.debug("Telegram 알림 미설정으로 발송 생략");
            return false;
        }

        try {
            String url = String.format("https://api.telegram.org/bot%s/sendMessage", telegramProperties.getBotToken());
            Map<String, Object> body = Map.of(
                    "chat_id", telegramProperties.getChatId(),
                    "text", text
            );

            JsonNode res = defaultRestClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (res != null && res.path("ok").asBoolean(false)) {
                log.info("📱 Telegram 알림 발송 성공 to chat_id={}", telegramProperties.getChatId());
                return true;
            } else {
                log.warn("Telegram 알림 발송 실패 응답: {}", res);
                return false;
            }
        } catch (Exception e) {
            log.error("Telegram 알림 전송 중 오류 발생 (예약 본체 영향 없음): {}", e.getMessage());
            return false;
        }
    }

    /**
     * 취소표 즉시 예약(결제대기) 성공 시 긴급 알림 발송
     */
    public boolean sendReservationAlert(KorailDto.TrainSchedule train, String pnrNo, String limitDate, String limitTime) {
        String departureDateFormatted = "";
        if (train.getDepartureDate() != null && train.getDepartureDate().length() >= 8) {
            departureDateFormatted = train.getDepartureDate().substring(0, 4) + "-" +
                    train.getDepartureDate().substring(4, 6) + "-" +
                    train.getDepartureDate().substring(6, 8);
        }

        String limitText = "";
        if (limitDate != null && !limitDate.isBlank() && limitTime != null && !limitTime.isBlank()) {
            limitText = limitDate + " " + limitTime;
        } else if (limitTime != null && !limitTime.isBlank()) {
            limitText = limitTime;
        } else {
            limitText = "약 10~20분 이내 (코레일톡 확인 필요)";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("🚨 [코레일 취소표 예약 성공 (결제대기!)]\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━\n");
        sb.append(String.format("🚄 열차: %s %s호\n", train.getTrainType() != null ? train.getTrainType() : "KTX", train.getTrainNo()));
        sb.append(String.format("📍 구간: %s ➡️ %s\n", train.getDepartureStation(), train.getArrivalStation()));
        if (!departureDateFormatted.isBlank()) {
            sb.append(String.format("📅 탑승일: %s\n", departureDateFormatted));
        }
        sb.append(String.format("⏰ 시간: %s 출발 (소요: %s)\n", train.getDepartureTime(), train.getRunTime() != null ? train.getRunTime() : "-"));
        if (pnrNo != null && !pnrNo.isBlank()) {
            sb.append(String.format("🎫 PNR(예약번호): %s\n", pnrNo));
        }
        sb.append("────────────────────\n");
        sb.append(String.format("⏳ 결제 기한: %s까지\n", limitText));
        sb.append("⚠️ 기한 내 미결제 시 좌석이 자동 취소됩니다!\n");
        sb.append("👉 지금 즉시 코레일톡 앱의 [승차권 확인]에서 결제하세요!\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━");

        return sendTextMessage(sb.toString());
    }

    /**
     * 예매대기 정규 접수 완료 시 알림 발송
     */
    public boolean sendWaitlistAlert(KorailDto.TrainSchedule train, String pnrNo, String message) {
        StringBuilder sb = new StringBuilder();
        sb.append("⏳ [코레일 예매대기 정규 접수 완료]\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━\n");
        sb.append(String.format("🚄 열차: %s %s호\n", train.getTrainType() != null ? train.getTrainType() : "KTX", train.getTrainNo()));
        sb.append(String.format("📍 구간: %s ➡️ %s\n", train.getDepartureStation(), train.getArrivalStation()));
        sb.append(String.format("⏰ 시간: %s 출발\n", train.getDepartureTime()));
        if (pnrNo != null && !pnrNo.isBlank()) {
            sb.append(String.format("🎫 대기 접수번호(PNR): %s\n", pnrNo));
        }
        if (message != null && !message.isBlank()) {
            sb.append(String.format("💬 안내: %s\n", message));
        }
        sb.append("────────────────────\n");
        sb.append("ℹ️ 앞사람 취소로 정식 좌석이 배정되면 코레일 본사에서 SMS/알림톡이 추가 발송됩니다.\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━");

        return sendTextMessage(sb.toString());
    }
}
