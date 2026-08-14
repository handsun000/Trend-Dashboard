package com.trend.backend.batch;

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

    @Scheduled(fixedRate = 3000)
    public void streamRealtimeTicks() {
        String timeStr = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

        // 1. Dynamic Crypto Ticks from Upbit Open API
        if (!activeCryptoTickers.isEmpty()) {
            try {
                String marketParam = String.join(",", activeCryptoTickers);
                List<UpbitTickerDto> cryptoTickers = upbitApiClient.fetchRealtimeTickers(marketParam);
                if (cryptoTickers != null) {
                    for (UpbitTickerDto dto : cryptoTickers) {
                        String cryptoMessage = String.format("{\"ticker\":\"%s\", \"price\":%.0f, \"time\":\"%s\"}", dto.getMarket(), dto.getTradePrice(), timeStr);
                        messagingTemplate.convertAndSend("/topic/ticks", cryptoMessage);
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
                String stockMessage = String.format("{\"ticker\":\"%s\", \"price\":%.0f, \"time\":\"%s\"}", stockCode, stockPrice, timeStr);
                messagingTemplate.convertAndSend("/topic/ticks", stockMessage);
            } catch (Exception e) {
                log.warn("Failed to stream Stock tick for {}: {}", stockCode, e.getMessage());
            }
        }
    }
}
