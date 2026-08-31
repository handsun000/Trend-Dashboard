package com.trend.backend.batch;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
public class UpbitApiClient {

    private final RestClient restClient = RestClient.create();

    public List<UpbitTickerDto> fetchRealtimeTickers(String markets) {
        try {
            UpbitTickerDto[] response = restClient.get()
                    .uri("https://api.upbit.com/v1/ticker?markets=" + markets)
                    .retrieve()
                    .body(UpbitTickerDto[].class);

            if (response != null) {
                log.info("Successfully fetched {} real-time tickers from Upbit Open API", response.length);
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit API data", e);
        }
        return List.of();
    }

    public List<UpbitMarketDto> fetchAllMarkets() {
        try {
            UpbitMarketDto[] response = restClient.get()
                    .uri("https://api.upbit.com/v1/market/all?isDetails=false")
                    .retrieve()
                    .body(UpbitMarketDto[].class);

            if (response != null) {
                log.info("Successfully fetched {} markets from Upbit Open API", response.length);
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit Market list", e);
        }
        return List.of();
    }

    public List<UpbitOrderbookDto> fetchOrderbook(String markets) {
        try {
            UpbitOrderbookDto[] response = restClient.get()
                    .uri("https://api.upbit.com/v1/orderbook?markets=" + markets)
                    .retrieve()
                    .body(UpbitOrderbookDto[].class);

            if (response != null) {
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Upbit live orderbook for {}", markets, e);
        }
        return List.of();
    }
}
