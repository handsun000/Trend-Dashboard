package com.trend.backend.batch;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpbitTickerDto {
    private String market;

    @JsonProperty("trade_price")
    private Double tradePrice;

    @JsonProperty("signed_change_rate")
    private Double signedChangeRate;

    @JsonProperty("signed_change_price")
    private Double signedChangePrice;

    @JsonProperty("prev_closing_price")
    private Double prevClosingPrice;

    @JsonProperty("high_price")
    private Double highPrice;

    @JsonProperty("low_price")
    private Double lowPrice;

    @JsonProperty("acc_trade_volume_24h")
    private Double accTradeVolume24h;

    @JsonProperty("acc_trade_price_24h")
    private Double accTradePrice24h;
}
