package com.trend.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class MarketHeatmapDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeatmapItem {
        private String ticker;
        private String name;
        private String sector; // e.g. "반도체/AI", "2차전지", "바이오/제약", "가상자산"
        private String market; // KOSPI, KOSDAQ, CRYPTO
        private double price;
        private double changeRate; // % e.g. 2.45 or -1.82
        private long marketCap; // 시가총액 (원)
        private long tradeVolume; // 거래대금
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectorGroup {
        private String sectorName;
        private double averageChangeRate;
        private List<HeatmapItem> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeatmapResponse {
        private String marketType; // STOCKS or CRYPTO
        private List<SectorGroup> sectors;
        private long updatedAt;
    }
}
