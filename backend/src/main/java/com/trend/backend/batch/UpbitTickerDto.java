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

    @JsonProperty("acc_trade_volume_24h")
    private Double accTradeVolume24h;
}
