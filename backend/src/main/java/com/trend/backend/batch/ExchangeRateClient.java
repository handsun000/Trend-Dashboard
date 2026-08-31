package com.trend.backend.batch;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ExchangeRateClient {

    private final RestClient restClient = RestClient.create();
    private final UpbitApiClient upbitApiClient;

    private double cachedUsdKrw = 1380.0;
    private double cachedJpyKrw = 890.0;
    private double cachedEurKrw = 1490.0;
    private long lastFetchedTime = 0;
    private static final long CACHE_TTL_MS = 60 * 1000L; // 1분 캐시

    public ExchangeRateClient(UpbitApiClient upbitApiClient) {
        this.upbitApiClient = upbitApiClient;
    }

    public double fetchUsdKrwRate() {
        if (System.currentTimeMillis() - lastFetchedTime < CACHE_TTL_MS && cachedUsdKrw > 0) {
            return cachedUsdKrw;
        }

        // 1. 실시간 글로벌 기준 환율 API 호출
        try {
            ExchangeRateApiResponse response = restClient.get()
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
            log.warn("Global Open Exchange API encountered: {}, trying Upbit USDT live rate", e.getMessage());
        }

        // 2. Fallback: Upbit KRW-USDT 실시간 테더 환율
        try {
            List<UpbitTickerDto> tickers = upbitApiClient.fetchRealtimeTickers("KRW-USDT");
            if (!tickers.isEmpty() && tickers.get(0).getTradePrice() != null) {
                cachedUsdKrw = tickers.get(0).getTradePrice();
                lastFetchedTime = System.currentTimeMillis();
                log.info("Live USDT/KRW Rate from Upbit: {}원", cachedUsdKrw);
                return cachedUsdKrw;
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit USDT exchange rate", e);
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
