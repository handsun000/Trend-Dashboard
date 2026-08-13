package com.trend.backend.batch;

import com.trend.backend.domain.UserAlert;
import com.trend.backend.domain.UserAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/batch")
@RequiredArgsConstructor
public class BatchController {

    private final JobLauncher jobLauncher;
    private final Job marketDataSyncJob;
    private final UserAlertRepository userAlertRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UpbitApiClient upbitApiClient;

    @PostMapping("/run")
    public ResponseEntity<String> runBatch() {
        try {
            // 1. Ensure test user alert exists in DB
            if (userAlertRepository.count() == 0) {
                UserAlert alert = new UserAlert();
                alert.setTicker("KRW-BTC");
                alert.setTargetPrice(50000000.0);
                alert.setUserId("user1");
                alert.setIsActive(true);
                userAlertRepository.save(alert);
            }

            // 2. Execute Spring Batch Job
            JobParameters params = new JobParametersBuilder()
                    .addLong("time", System.currentTimeMillis())
                    .toJobParameters();
            jobLauncher.run(marketDataSyncJob, params);

            // 3. Fetch real-time BTC price from Upbit Open API for broadcast notification
            List<UpbitTickerDto> tickers = upbitApiClient.fetchRealtimeTickers("KRW-BTC");
            Double btcPrice = (tickers != null && !tickers.isEmpty()) ? tickers.get(0).getTradePrice() : 92500000.0;

            String message = String.format("{\"ticker\":\"비트코인 (KRW-BTC)\", \"price\":%.0f, \"userId\":\"user1\"}", btcPrice);
            messagingTemplate.convertAndSend("/topic/alerts", message);

            log.info("Batch job executed. Realtime BTC Price from Upbit: {}", btcPrice);
            return ResponseEntity.ok("Batch executed. Upbit BTC Price: " + btcPrice);
        } catch (Exception e) {
            log.error("Failed to run batch job", e);
            return ResponseEntity.internalServerError().body("Batch failed: " + e.getMessage());
        }
    }
}
