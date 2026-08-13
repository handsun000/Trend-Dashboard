package com.trend.backend.batch;

import com.trend.backend.domain.StockHistory;
import com.trend.backend.domain.UserAlert;
import com.trend.backend.domain.UserAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MarketDataItemProcessor implements ItemProcessor<StockHistory, StockHistory> {

    private final UserAlertRepository userAlertRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public StockHistory process(StockHistory item) throws Exception {
        List<UserAlert> alerts = userAlertRepository.findByTickerAndIsActiveTrue(item.getTicker());
        
        for (UserAlert alert : alerts) {
            if (item.getCurrentPrice() >= alert.getTargetPrice()) {
                String message = String.format("{\"ticker\":\"%s\", \"price\":%f, \"userId\":\"%s\"}", 
                        item.getTicker(), item.getCurrentPrice(), alert.getUserId());
                
                // 1. Direct WebSocket STOMP Push
                try {
                    messagingTemplate.convertAndSend("/topic/alerts", message);
                } catch (Exception e) {
                    log.warn("STOMP push failed: {}", e.getMessage());
                }

                // 2. Redis Pub/Sub Push (safe fallback)
                try {
                    redisTemplate.convertAndSend("alert-channel", message);
                } catch (Exception e) {
                    log.warn("Redis unavailable for pub/sub: {}", e.getMessage());
                }
            }
        }
        
        return item;
    }
}
