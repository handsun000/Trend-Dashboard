package com.trend.backend.batch;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
     * 한국투자증권 OAuth2 접근 토큰 발급
     */
    public synchronized String getAccessToken() {
        if (cachedAccessToken != null && System.currentTimeMillis() < tokenExpiryTime) {
            return cachedAccessToken;
        }

        if ("dummy_app_key".equals(appKey)) {
            log.info("KIS APP_KEY is unconfigured. Using fallback price mode.");
            return null;
        }

        try {
            Map<String, String> body = Map.of(
                    "grant_type", "client_credentials",
                    "appkey", appKey,
                    "appsecret", appSecret
            );

            KisTokenDto tokenDto = restClient.post()
                    .uri(domain + "/oauth2/tokenP")
                    .body(body)
                    .retrieve()
                    .body(KisTokenDto.class);

            if (tokenDto != null && tokenDto.getAccessToken() != null) {
                this.cachedAccessToken = tokenDto.getAccessToken();
                this.tokenExpiryTime = System.currentTimeMillis() + (86000 * 1000L); // ~24h
                log.info("Successfully issued Korea Investment Open API Access Token.");
                return cachedAccessToken;
            }
        } catch (Exception e) {
            log.warn("Failed to get KIS Access Token: {}", e.getMessage());
        }

        return null;
    }

    /**
     * 국내 주식 현재가 시세 조회 (FID: FHKST01010100)
     */
    public Double fetchStockPrice(String stockCode) {
        String token = getAccessToken();

        if (token != null) {
            try {
                KisPriceDto priceDto = restClient.get()
                        .uri(domain + "/uapi/domestic-stock/v1/quoting/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=" + stockCode)
                        .header("authorization", "Bearer " + token)
                        .header("appkey", appKey)
                        .header("appsecret", appSecret)
                        .header("tr_id", "FHKST01010100")
                        .retrieve()
                        .body(KisPriceDto.class);

                if (priceDto != null && priceDto.getOutput() != null && priceDto.getOutput().getCurrentPrice() != null) {
                    double price = Double.parseDouble(priceDto.getOutput().getCurrentPrice());
                    log.info("Fetched live stock price from KIS API [{}]: ₩{}", stockCode, price);
                    return price;
                }
            } catch (Exception e) {
                log.warn("Failed to fetch KIS stock price for {}: {}", stockCode, e.getMessage());
            }
        }

        // Fallback default stock price if API Key is not set or request fails
        return "005930".equals(stockCode) ? 83200.0 : 173500.0;
    }
}
