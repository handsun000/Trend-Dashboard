package com.trend.backend.batch;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpbitOrderbookDto {

    private String market;
    private Long timestamp;

    @JsonProperty("total_ask_size")
    private Double totalAskSize;

    @JsonProperty("total_bid_size")
    private Double totalBidSize;

    @JsonProperty("orderbook_units")
    private List<OrderbookUnit> orderbookUnits;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderbookUnit {
        @JsonProperty("ask_price")
        private Double askPrice;

        @JsonProperty("bid_price")
        private Double bidPrice;

        @JsonProperty("ask_size")
        private Double askSize;

        @JsonProperty("bid_size")
        private Double bidSize;
    }
}
