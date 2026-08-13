package com.trend.backend.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealtimeTickStreamer {

    private final SimpMessagingTemplate messagingTemplate;
    private final UpbitApiClient upbitApiClient;
    private final KisApiClient kisApiClient;

    @Scheduled(fixedRate = 3000)
    public void streamRealtimeTicks() {
        String timeStr = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        // 1. Real-time BTC Tick from Upbit Open API
        try {
            List<UpbitTickerDto> btcTickers = upbitApiClient.fetchRealtimeTickers("KRW-BTC");
            if (btcTickers != null && !btcTickers.isEmpty()) {
                Double btcPrice = btcTickers.get(0).getTradePrice();
                String btcMessage = String.format("{\"ticker\":\"KRW-BTC\", \"price\":%.0f, \"time\":\"%s\"}", btcPrice, timeStr);
                messagingTemplate.convertAndSend("/topic/ticks", btcMessage);
            }
        } catch (Exception e) {
            log.warn("Failed to stream BTC tick: {}", e.getMessage());
        }

        // 2. Real-time Samsung Stock Tick from Korea Investment (KIS) Open API
        try {
            Double stockPrice = kisApiClient.fetchStockPrice("005930");
            String stockMessage = String.format("{\"ticker\":\"005930\", \"price\":%.0f, \"time\":\"%s\"}", stockPrice, timeStr);
            messagingTemplate.convertAndSend("/topic/ticks", stockMessage);
        } catch (Exception e) {
            log.warn("Failed to stream Stock tick: {}", e.getMessage());
        }
    }
}
