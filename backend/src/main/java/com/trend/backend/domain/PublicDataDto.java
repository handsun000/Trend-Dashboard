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
        private Boolean isLive;           // 100% 국토교통부 실시간 OpenAPI 수신 여부

        // 1. 동적 매물 스펙 필드
        private String direction;              // "남향", "남동향", "동향" 등
        private Double parkingPerHousehold;    // 세대당 주차대수 (예: 1.85)
        private Integer elevatorCount;         // 승강기 수 (예: 2)
        private String subwayInfo;             // "신분당선 판교역 도보 4분"
        private Integer walkTimeToSubway;      // 도보 시간(분)
        private String buildingStructure;      // "계단식", "타워형", "복도식"

        // 2. 권리분석 및 보증금 안전도 (신호등 시스템)
        private String safetyRating;           // "SAFE", "CAUTION", "DANGER"
        private Double seniorMortgageWon;      // 선순위 근저당 (억원)
        private Double jeonseRatio;            // 전세가율 (%)
        private Boolean isHugEligible;         // HUG 전세보증보험 100% 가입 가능 여부
        private String safetyAnalysisReport;   // 실시간 권리분석 요약 리포트

        // 3. 지역 시세 비교 및 백분위수 인포그래픽
        private Double districtAvgPrice;       // 해당 권역/평형 평균 시세 (억원)
        private Double districtMinPrice;       // 권역 최저 거래가 (억원)
        private Double districtMaxPrice;       // 권역 최고 거래가 (억원)
        private Integer pricePercentile;       // 권역 내 가격 백분위 (0 ~ 100%)

        // 4. 관리비
        private Integer maintenanceFee;        // 월 평균 관리비 (만원)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TabCounts {
        private int totalCount;
        private int aptCount;
        private int offiCount;
        private int villaCount;
        private int tradeCount;
        private int jeonseCount;
        private int rentCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PagedRealEstateResponse {
        private List<RealEstateTransaction> content;
        private int page;
        private int size;
        private int totalElements;
        private int totalPages;
        private TabCounts tabCounts;
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
