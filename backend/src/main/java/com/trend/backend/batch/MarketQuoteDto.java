package com.trend.backend.batch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketQuoteDto {
    private String ticker;
    private String name;
    private String market;
    private Double price;
    private Double changeAmount;
    private Double changeRate;
    private Double prevClose;
    private Double high;
    private Double low;
    private Double open;
    private Double volume;
    private Double tradeValue;
    private String formattedChange;
}
