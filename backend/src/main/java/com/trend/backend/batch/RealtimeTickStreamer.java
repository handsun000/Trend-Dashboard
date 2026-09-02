package com.trend.backend.batch;

import com.trend.backend.domain.UserAlert;
import com.trend.backend.domain.UserAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealtimeTickStreamer {

    private final SimpMessagingTemplate messagingTemplate;
    private final UpbitApiClient upbitApiClient;
    private final KisApiClient kisApiClient;
    private final UserAlertRepository userAlertRepository;

    private final Set<String> activeCryptoTickers = ConcurrentHashMap.newKeySet();
    private final Set<String> activeStockTickers = ConcurrentHashMap.newKeySet();

    @jakarta.annotation.PostConstruct
    public void initDefaultTickers() {
        activeCryptoTickers.add("KRW-BTC");
        activeCryptoTickers.add("KRW-ETH");
        activeStockTickers.add("005930");
        activeStockTickers.add("000660");
    }

    public void registerTicker(String ticker) {
        if (ticker == null || ticker.isBlank()) return;
        String clean = ticker.trim();
        if (clean.startsWith("KRW-") || clean.startsWith("BTC-") || clean.startsWith("USDT-")) {
            activeCryptoTickers.add(clean);
        } else {
            activeStockTickers.add(clean);
        }
    }

    @Scheduled(fixedRate = 1000)
    public void streamRealtimeTicks() {
        String timeStr = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        List<UserAlert> activeAlerts = userAlertRepository.findByIsActiveTrue();

        // 1. Dynamic Crypto Ticks from Upbit Open API
        if (!activeCryptoTickers.isEmpty()) {
            try {
                String marketParam = String.join(",", activeCryptoTickers);
                List<UpbitTickerDto> cryptoTickers = upbitApiClient.fetchRealtimeTickers(marketParam);
                if (cryptoTickers != null) {
                    for (UpbitTickerDto dto : cryptoTickers) {
                        double price = dto.getTradePrice();
                        String ticker = dto.getMarket();
                        String cryptoMessage = String.format("{\"ticker\":\"%s\", \"price\":%.0f, \"time\":\"%s\"}", ticker, price, timeStr);
                        messagingTemplate.convertAndSend("/topic/ticks", cryptoMessage);

                        checkAndDispatchAlerts(ticker, price, activeAlerts);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to stream Crypto ticks: {}", e.getMessage());
            }
        }

        // 2. Dynamic Stock Ticks from Korea Investment (KIS) Open API
        for (String stockCode : activeStockTickers) {
            try {
                Double stockPrice = kisApiClient.fetchStockPrice(stockCode);
                if (stockPrice != null && stockPrice > 0) {
                    String stockMessage = String.format("{\"ticker\":\"%s\", \"price\":%.0f, \"time\":\"%s\"}", stockCode, stockPrice, timeStr);
                    messagingTemplate.convertAndSend("/topic/ticks", stockMessage);

                    checkAndDispatchAlerts(stockCode, stockPrice, activeAlerts);
                }
            } catch (Exception e) {
                log.warn("Failed to stream Stock tick for {}: {}", stockCode, e.getMessage());
            }
        }
    }

    private void checkAndDispatchAlerts(String ticker, double currentPrice, List<UserAlert> activeAlerts) {
        if (activeAlerts == null || activeAlerts.isEmpty()) return;

        for (UserAlert alert : activeAlerts) {
            if (alert.getTicker() != null && alert.getTicker().equalsIgnoreCase(ticker) && Boolean.TRUE.equals(alert.getIsActive())) {
                double target = alert.getTargetPrice();
                // 도달 판별: 현재가가 목표가 이상(상향 돌파)인 경우 알림 발송
                if (currentPrice >= target) {
                    log.info("🔔 [Realtime Alert Triggered] Ticker: {}, Current: {}, Target: {}", ticker, currentPrice, target);
                    String alertJson = String.format(
                            "{\"id\":%d, \"userId\":\"%s\", \"ticker\":\"%s\", \"price\":%.0f, \"targetPrice\":%.0f, \"timestamp\":\"%s\"}",
                            alert.getId(), alert.getUserId(), ticker, currentPrice, target, LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
                    );
                    messagingTemplate.convertAndSend("/topic/alerts", alertJson);
                    alert.setIsActive(false);
                    userAlertRepository.save(alert);
                }
            }
        }
    }
}

