package com.trend.backend.client.exchangerate;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.client.upbit.UpbitApiClient;
import com.trend.backend.client.upbit.UpbitTickerDto;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateClient implements ExternalApiClient {

    private final RestClient defaultRestClient;
    private final UpbitApiClient upbitApiClient;

    private double cachedUsdKrw = 1380.0;
    private double cachedJpyKrw = 890.0;
    private double cachedEurKrw = 1490.0;
    private long lastFetchedTime = 0;
    private static final long CACHE_TTL_MS = 60 * 1000L; // 1분 캐시

    @Override
    public String getProviderName() {
        return "EXCHANGE_RATE";
    }

    @Override
    public boolean isConfigured() {
        return true; // 공개 환율 API 및 업비트 USDT Fallback 사용
    }

    @Override
    public ExternalApiHealth checkHealth() {
        long start = System.currentTimeMillis();
        try {
            double rate = fetchUsdKrwRate();
            long latency = System.currentTimeMillis() - start;
            if (rate > 500) {
                return ExternalApiHealth.healthy("EXCHANGE_RATE", "실시간 환율 수신 정상 (USD/KRW: " + rate + "원)", latency);
            } else {
                return ExternalApiHealth.degraded("EXCHANGE_RATE", "비정상 환율 수치 감지: " + rate, latency);
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            return ExternalApiHealth.unavailable("EXCHANGE_RATE", "환율 조회 실패: " + e.getMessage(), latency);
        }
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "exchangerate", fallbackMethod = "fallbackExchangeRate")
    @io.github.resilience4j.retry.annotation.Retry(name = "exchangerate")
    public double fetchUsdKrwRate() {
        if (System.currentTimeMillis() - lastFetchedTime < CACHE_TTL_MS && cachedUsdKrw > 0) {
            return cachedUsdKrw;
        }

        // 1. 실시간 글로벌 기준 환율 API 호출
        try {
            ExchangeRateApiResponse response = defaultRestClient.get()
                    .uri("https://open.er-api.com/v6/latest/USD")
                    .retrieve()
                    .body(ExchangeRateApiResponse.class);

            if (response != null && response.getRates() != null) {
                Double krwRate = response.getRates().get("KRW");
                Double jpyRate = response.getRates().get("JPY");
                Double eurRate = response.getRates().get("EUR");

                if (krwRate != null && krwRate > 500) {
                    cachedUsdKrw = Math.round(krwRate * 10.0) / 10.0;
                    if (jpyRate != null && jpyRate > 0) {
                        cachedJpyKrw = Math.round((krwRate / jpyRate * 100.0) * 10.0) / 10.0; // 100엔당 원화
                    }
                    if (eurRate != null && eurRate > 0) {
                        cachedEurKrw = Math.round((krwRate / eurRate) * 10.0) / 10.0;
                    }
                    lastFetchedTime = System.currentTimeMillis();
                    log.info("Live Exchange Rate updated: USD/KRW = {}원, 100JPY/KRW = {}원", cachedUsdKrw, cachedJpyKrw);
                    return cachedUsdKrw;
                }
            }
        } catch (Exception e) {
            log.warn("Global Open Exchange API encountered: {}, delegating to fallback", e.getMessage());
            throw new RuntimeException("Global Exchange Rate API error", e);
        }

        return fallbackExchangeRate(new RuntimeException("No rates returned from Global API"));
    }

    public double fallbackExchangeRate(Throwable t) {
        log.warn("[Resilience4j] Global ER-API CircuitBreaker/Retry fallback activated: {}. Using Upbit USDT live rate", t.getMessage());
        try {
            List<UpbitTickerDto> tickers = upbitApiClient.fetchRealtimeTickers("KRW-USDT");
            if (!tickers.isEmpty() && tickers.get(0).getTradePrice() != null) {
                cachedUsdKrw = tickers.get(0).getTradePrice();
                lastFetchedTime = System.currentTimeMillis();
                log.info("Live USDT/KRW Rate from Upbit Fallback: {}원", cachedUsdKrw);
                return cachedUsdKrw;
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit USDT exchange rate in fallback: {}", e.getMessage());
        }
        return cachedUsdKrw;
    }


    public double getJpyKrwRate() {
        fetchUsdKrwRate();
        return cachedJpyKrw;
    }

    public double getEurKrwRate() {
        fetchUsdKrwRate();
        return cachedEurKrw;
    }

    @Data
    @NoArgsConstructor
    public static class ExchangeRateApiResponse {
        private String result;
        private String base_code;
        @JsonProperty("rates")
        private Map<String, Double> rates;
    }
}
