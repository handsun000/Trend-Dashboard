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
        private Double maxTemperature;
        private Double minTemperature;
        private Double totalRainfall;
        private Double deliveryDemandIndex;
        private Integer totalRealEstateTxCount;
        private String highestTransactionApt;
        private Double highestTransactionPrice;
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
        private String district;
        private String dong;
        private String area;
        private Double areaM2;
        private Double pyeong;
        private String floor;
        private Integer buildYear;
        private String propertyType;      // APT (아파트), OFFI (오피스텔), VILLA (빌라/연립)
        private String propertyTypeLabel; // 아파트 🏢, 오피스텔 🏬, 빌라/다세대 🏡
        private String dealCategory;      // TRADE (매매), JEONSE (전세), RENT (월세)
        private Double recentPrice;       // 억원 (호환용)
        private Double tradePrice;        // 억원
        private String tradePriceWon;     // 32억 7,000만원
        private String formattedPrice;    // 매매 32억 7,000만원 / 전세 18억 / 보증금 5억, 월 250만
        private Double deposit;           // 보증금 (억원)
        private Double monthlyRent;       // 월세 (만원)
        private Double prevPrice;         // 억원
        private String changeFormatted;
        private Double changeRate;
        private String tradeDate;
        private String tradeType;         // 매매(중개거래) / 전세(신규) / 월세
        private String status;            // 초고가/신고가, 우상향, 전세, 월세 등
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
