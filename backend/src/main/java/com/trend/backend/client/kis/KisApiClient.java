package com.trend.backend.client.kis;

import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.client.config.ExternalApiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KisApiClient implements ExternalApiClient {

    private final ExternalApiProperties.KisProperties kisProperties;
    private final RestClient defaultRestClient;

    private String cachedAccessToken;
    private long tokenExpiryTime = 0;

    @Override
    public String getProviderName() {
        return "KIS";
    }

    @Override
    public boolean isConfigured() {
        return kisProperties.isConfigured();
    }

    @Override
    public ExternalApiHealth checkHealth() {
        if (!isConfigured()) {
            return ExternalApiHealth.unconfigured("KIS", "한국투자증권 APP_KEY 또는 APP_SECRET 미설정 (모의/Fallback 모드 동작)");
        }

        long start = System.currentTimeMillis();
        try {
            String token = getAccessToken();
            long latency = System.currentTimeMillis() - start;
            if (token != null) {
                return ExternalApiHealth.healthy("KIS", "OAuth2 토큰 정상 발급/보유 중", latency);
            } else {
                return ExternalApiHealth.unavailable("KIS", "OAuth2 토큰 발급 실패", latency);
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            return ExternalApiHealth.unavailable("KIS", "KIS API 통신 오류: " + e.getMessage(), latency);
        }
    }

    /**
     * 한국투자증권 OAuth2 접근 토큰 발급 (모의/실전 자동 시도)
     */
    public synchronized String getAccessToken() {
        if (cachedAccessToken != null && System.currentTimeMillis() < tokenExpiryTime) {
            return cachedAccessToken;
        }

        if (!kisProperties.isConfigured()) {
            log.info("KIS APP_KEY is unconfigured. Using fallback price mode.");
            return null;
        }

        String[] domainsToTry = {
                kisProperties.getDomain(),
                "https://openapi.koreainvestment.com:9443",
                "https://openapivts.koreainvestment.com:29443"
        };

        for (String targetDomain : domainsToTry) {
            try {
                Map<String, String> body = Map.of(
                        "grant_type", "client_credentials",
                        "appkey", kisProperties.getAppKey(),
                        "appsecret", kisProperties.getAppSecret());

                KisTokenDto tokenDto = defaultRestClient.post()
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

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "kis", fallbackMethod = "fallbackStockQuote")
    @io.github.resilience4j.retry.annotation.Retry(name = "kis")
    public KisPriceDto.Output fetchStockQuote(String stockCode) {
        String token = getAccessToken();

        if (token != null) {
            String[] domainsToTry = {
                    kisProperties.getDomain(),
                    "https://openapi.koreainvestment.com:9443",
                    "https://openapivts.koreainvestment.com:29443"
            };

            for (String targetDomain : domainsToTry) {
                try {
                    String uri = targetDomain
                            + "/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD="
                            + stockCode;

                    KisPriceDto priceDto = defaultRestClient.get()
                            .uri(uri)
                            .header("content-type", "application/json")
                            .header("authorization", "Bearer " + token)
                            .header("appkey", kisProperties.getAppKey())
                            .header("appsecret", kisProperties.getAppSecret())
                            .header("tr_id", "FHKST01010100")
                            .header("custtype", "P")
                            .retrieve()
                            .body(KisPriceDto.class);

                    if (priceDto != null && priceDto.getOutput() != null
                            && priceDto.getOutput().getCurrentPrice() != null) {
                        return priceDto.getOutput();
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch KIS quote from {}: {}", targetDomain, e.getMessage());
                    throw new RuntimeException("KIS API fetch error from " + targetDomain, e);
                }
            }
        }

        // Token is null or unconfigured
        return generateMockQuote(stockCode);
    }

    public KisPriceDto.Output fallbackStockQuote(String stockCode, Throwable t) {
        log.warn("[Resilience4j] KIS API CircuitBreaker/Retry fallback activated for stock [{}]: {}", stockCode, t.getMessage());
        return generateMockQuote(stockCode);
    }


    public Double fetchStockPrice(String stockCode) {
        KisPriceDto.Output output = fetchStockQuote(stockCode);
        if (output != null && output.getCurrentPrice() != null) {
            try {
                return Double.parseDouble(output.getCurrentPrice());
            } catch (NumberFormatException ignored) {
            }
        }
        return 70000.0;
    }

    private KisPriceDto.Output generateMockQuote(String stockCode) {
        KisPriceDto.Output output = new KisPriceDto.Output();
        double base = switch (stockCode) {
            case "005930" -> 72000.0;
            case "000660" -> 165000.0;
            case "035420" -> 195000.0;
            case "035720" -> 43000.0;
            default -> 50000.0;
        };

        double change = (Math.random() - 0.48) * (base * 0.02);
        double current = base + change;

        output.setCurrentPrice(String.valueOf((long) current));
        output.setChangeAmount(String.valueOf((long) change));
        output.setChangeRate(String.format("%.2f", (change / base) * 100));
        output.setOpenPrice(String.valueOf((long) base));
        output.setHighPrice(String.valueOf((long) (base * 1.015)));
        output.setLowPrice(String.valueOf((long) (base * 0.985)));
        output.setVolume("1250000");
        output.setTradeValue("89000000000");
        return output;
    }
}
