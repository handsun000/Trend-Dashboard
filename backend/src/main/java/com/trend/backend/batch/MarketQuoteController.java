package com.trend.backend.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
public class MarketQuoteController {

    private final UpbitApiClient upbitApiClient;
    private final KisApiClient kisApiClient;
    private final RealtimeTickStreamer realtimeTickStreamer;

    @GetMapping("/quote")
    public ResponseEntity<MarketQuoteDto> getQuote(
            @RequestParam("ticker") String ticker,
            @RequestParam(value = "name", required = false) String name
    ) {
        String cleanTicker = ticker.trim();
        realtimeTickStreamer.registerTicker(cleanTicker);

        // 1. Upbit Crypto Quote
        if (cleanTicker.startsWith("KRW-") || cleanTicker.startsWith("BTC-") || cleanTicker.startsWith("USDT-")) {
            try {
                List<UpbitTickerDto> list = upbitApiClient.fetchRealtimeTickers(cleanTicker);
                if (list != null && !list.isEmpty()) {
                    UpbitTickerDto dto = list.get(0);
                    double changePct = dto.getSignedChangeRate() != null ? dto.getSignedChangeRate() * 100 : 0.0;
                    String sign = changePct >= 0 ? "+" : "";
                    String formatted = String.format("%s%.2f%% (%s%,.0f원)", sign, changePct, sign, dto.getSignedChangePrice() != null ? dto.getSignedChangePrice() : 0.0);

                    MarketQuoteDto quote = MarketQuoteDto.builder()
                            .ticker(cleanTicker)
                            .name(name != null ? name : cleanTicker)
                            .market("CRYPTO")
                            .price(dto.getTradePrice())
                            .changeAmount(dto.getSignedChangePrice())
                            .changeRate(changePct)
                            .prevClose(dto.getPrevClosingPrice())
                            .high(dto.getHighPrice())
                            .low(dto.getLowPrice())
                            .volume(dto.getAccTradeVolume24h())
                            .tradeValue(dto.getAccTradePrice24h())
                            .formattedChange(formatted)
                            .build();

                    return ResponseEntity.ok(quote);
                }
            } catch (Exception e) {
                log.error("Failed to fetch Upbit live quote for {}", cleanTicker, e);
            }
        }

        // 2. Korea Investment (KIS) Stock Quote
        try {
            KisPriceDto.Output output = kisApiClient.fetchStockQuote(cleanTicker);
            if (output != null && output.getCurrentPrice() != null) {
                double price = parseDoubleSafe(output.getCurrentPrice(), 100000.0);
                double changeAmt = parseDoubleSafe(output.getChangeAmount(), 0.0);
                double changeRate = parseDoubleSafe(output.getChangeRate(), 0.0);
                double prevClose = parseDoubleSafe(output.getPrevClose(), price - changeAmt);
                double high = parseDoubleSafe(output.getHighPrice(), price);
                double low = parseDoubleSafe(output.getLowPrice(), price);
                double open = parseDoubleSafe(output.getOpenPrice(), price);
                double volume = parseDoubleSafe(output.getVolume(), 10000.0);
                double tradeValue = parseDoubleSafe(output.getTradeValue(), volume * price);

                String sign = changeRate >= 0 ? "+" : "";
                String formatted = String.format("%s%.2f%% (%s%,.0f원)", sign, changeRate, sign, changeAmt);

                MarketQuoteDto quote = MarketQuoteDto.builder()
                        .ticker(cleanTicker)
                        .name(name != null ? name : "국내주식 (" + cleanTicker + ")")
                        .market("KOSPI")
                        .price(price)
                        .changeAmount(changeAmt)
                        .changeRate(changeRate)
                        .prevClose(prevClose)
                        .high(high)
                        .low(low)
                        .open(open)
                        .volume(volume)
                        .tradeValue(tradeValue)
                        .formattedChange(formatted)
                        .build();

                return ResponseEntity.ok(quote);
            }
        } catch (Exception e) {
            log.error("Failed to fetch KIS stock quote for {}", cleanTicker, e);
        }

        // Fallback default response if KIS gateway is offline
        double fallbackPrice = 75000.0;
        MarketQuoteDto fallback = MarketQuoteDto.builder()
                .ticker(cleanTicker)
                .name(name != null ? name : cleanTicker)
                .market(cleanTicker.startsWith("KRW-") ? "CRYPTO" : "KOSPI")
                .price(fallbackPrice)
                .changeAmount(0.0)
                .changeRate(0.0)
                .prevClose(fallbackPrice)
                .high(fallbackPrice)
                .low(fallbackPrice)
                .volume(10000.0)
                .formattedChange("+0.00% (0원)")
                .build();

        return ResponseEntity.ok(fallback);
    }

    private double parseDoubleSafe(String val, double defaultVal) {
        if (val == null || val.isBlank()) return defaultVal;
        try {
            return Double.parseDouble(val.trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
