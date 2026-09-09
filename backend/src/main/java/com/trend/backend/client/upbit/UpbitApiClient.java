package com.trend.backend.client.upbit;

import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.client.config.ExternalApiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class UpbitApiClient implements ExternalApiClient {

    private final ExternalApiProperties.UpbitProperties upbitProperties;
    private final RestClient defaultRestClient;

    @Override
    public String getProviderName() {
        return "UPBIT";
    }

    @Override
    public boolean isConfigured() {
        return upbitProperties.isConfigured();
    }

    @Override
    public ExternalApiHealth checkHealth() {
        long start = System.currentTimeMillis();
        try {
            List<UpbitTickerDto> tickers = fetchRealtimeTickers("KRW-BTC");
            long latency = System.currentTimeMillis() - start;
            if (!tickers.isEmpty() && tickers.get(0).getTradePrice() != null) {
                return ExternalApiHealth.healthy("UPBIT", "비트코인 실시간 시세 조회 정상 (현재가: " + tickers.get(0).getTradePrice() + "원)", latency);
            } else {
                return ExternalApiHealth.degraded("UPBIT", "응답은 수신되었으나 시세 데이터가 비어있음", latency);
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            return ExternalApiHealth.unavailable("UPBIT", "업비트 Open API 호출 실패: " + e.getMessage(), latency);
        }
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "upbit", fallbackMethod = "fallbackRealtimeTickers")
    @io.github.resilience4j.retry.annotation.Retry(name = "upbit")
    public List<UpbitTickerDto> fetchRealtimeTickers(String markets) {
        try {
            String url = upbitProperties.getBaseUrl() + "/v1/ticker?markets=" + markets;
            UpbitTickerDto[] response = defaultRestClient.get()
                    .uri(url)
                    .retrieve()
                    .body(UpbitTickerDto[].class);

            if (response != null) {
                log.debug("Successfully fetched {} real-time tickers from Upbit Open API", response.length);
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit API data for markets [{}]: {}", markets, e.getMessage());
            throw new RuntimeException("Upbit API call failed for " + markets, e);
        }
        return List.of();
    }

    public List<UpbitTickerDto> fallbackRealtimeTickers(String markets, Throwable t) {
        log.warn("[Resilience4j] Upbit CircuitBreaker/Retry fallback activated for [{}]: {}", markets, t.getMessage());
        return List.of();
    }


    public List<UpbitMarketDto> fetchAllMarkets() {
        try {
            String url = upbitProperties.getBaseUrl() + "/v1/market/all?isDetails=false";
            UpbitMarketDto[] response = defaultRestClient.get()
                    .uri(url)
                    .retrieve()
                    .body(UpbitMarketDto[].class);

            if (response != null) {
                log.info("Successfully fetched {} markets from Upbit Open API", response.length);
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit Market list: {}", e.getMessage());
        }
        return List.of();
    }

    public List<UpbitOrderbookDto> fetchOrderbook(String markets) {
        try {
            String url = upbitProperties.getBaseUrl() + "/v1/orderbook?markets=" + markets;
            UpbitOrderbookDto[] response = defaultRestClient.get()
                    .uri(url)
                    .retrieve()
                    .body(UpbitOrderbookDto[].class);

            if (response != null) {
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit Orderbook data for markets [{}]: {}", markets, e.getMessage());
        }
        return List.of();
    }
}
