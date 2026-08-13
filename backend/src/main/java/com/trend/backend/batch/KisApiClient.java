package com.trend.backend.batch;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component
public class KisApiClient {

    @Value("${kis.open-api.app-key:dummy_app_key}")
    private String appKey;

    @Value("${kis.open-api.app-secret:dummy_app_secret}")
    private String appSecret;

    @Value("${kis.open-api.domain:https://openapivts.koreainvestment.com:29443}")
    private String domain;

    private final RestClient restClient = RestClient.create();
    private String cachedAccessToken;
    private long tokenExpiryTime = 0;

    /**
     * 한국투자증권 OAuth2 접근 토큰 발급 (모의/실전 자동 시도)
     */
    public synchronized String getAccessToken() {
        if (cachedAccessToken != null && System.currentTimeMillis() < tokenExpiryTime) {
            return cachedAccessToken;
        }

        if ("dummy_app_key".equals(appKey) || appKey == null || appKey.isBlank()) {
            log.info("KIS APP_KEY is unconfigured. Using fallback price mode.");
            return null;
        }

        String[] domainsToTry = {
            domain,
            "https://openapi.koreainvestment.com:9443",
            "https://openapivts.koreainvestment.com:29443"
        };

        for (String targetDomain : domainsToTry) {
            try {
                Map<String, String> body = Map.of(
                        "grant_type", "client_credentials",
                        "appkey", appKey,
                        "appsecret", appSecret
                );

                KisTokenDto tokenDto = restClient.post()
                        .uri(targetDomain + "/oauth2/tokenP")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(KisTokenDto.class);

                if (tokenDto != null && tokenDto.getAccessToken() != null) {
                    this.cachedAccessToken = tokenDto.getAccessToken();
                    this.tokenExpiryTime = System.currentTimeMillis() + (80000 * 1000L);
                    log.info("Successfully issued KIS Access Token from {}!", targetDomain);
                    return cachedAccessToken;
                }
            } catch (Exception e) {
                log.warn("KIS OAuth Token attempt failed at {}: {}", targetDomain, e.getMessage());
            }
        }

        return null;
    }

    /**
     * 국내 주식 현재가 시세 조회 (FID: FHKST01010100)
     */
    public Double fetchStockPrice(String stockCode) {
        String token = getAccessToken();

        if (token != null) {
            String[] domainsToTry = {
                domain,
                "https://openapi.koreainvestment.com:9443",
                "https://openapivts.koreainvestment.com:29443"
            };

            for (String targetDomain : domainsToTry) {
                try {
                    String uri = targetDomain + "/uapi/domestic-stock/v1/quoting/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=" + stockCode;
                    
                    KisPriceDto priceDto = restClient.get()
                            .uri(uri)
                            .header("content-type", "application/json")
                            .header("authorization", "Bearer " + token)
                            .header("appkey", appKey)
                            .header("appsecret", appSecret)
                            .header("tr_id", "FHKST01010100")
                            .header("custtype", "P")
                            .retrieve()
                            .body(KisPriceDto.class);

                    if (priceDto != null && priceDto.getOutput() != null && priceDto.getOutput().getCurrentPrice() != null) {
                        double price = Double.parseDouble(priceDto.getOutput().getCurrentPrice());
                        if (price > 0) {
                            log.info("Fetched live stock price from KIS API [{}] @ {}: ₩{}", stockCode, targetDomain, price);
                            return price;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch KIS stock price for {} @ {}: {}", stockCode, targetDomain, e.getMessage());
                }
            }
        }

        // Fallback default stock price if API Key is not set or request fails
        return "005930".equals(stockCode) ? 83200.0 : 173500.0;
    }
}
