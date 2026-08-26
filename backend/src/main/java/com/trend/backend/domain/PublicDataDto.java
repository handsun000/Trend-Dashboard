package com.trend.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class PublicDataDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private Double bokRate;
        private Double fedRate;
        private Double cpi;
        private Double ppi;
        private Double exchangeRate;
        private Double seoulApartmentIndex;
        private Double seoulApartmentChange;
        private Double avgTemperature;
        private Double deliveryDemandIndex;
        private String macroInsight;
        private String realEstateInsight;
        private String weatherInsight;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RealEstateTransaction {
        private String complexName;
        private String region;
        private String area;
        private Double recentPrice;       // 억원
        private Double prevPrice;         // 억원
        private String changeFormatted;
        private Double changeRate;
        private String tradeDate;
        private String status;            // 신고가, 상승, 보합, 하락
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartSeriesResponse {
        private String category;
        private List<Map<String, Object>> dataPoints;
    }
}
