package com.trend.backend.batch;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class KisPriceDto {

    @JsonProperty("output")
    private Output output;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Output {
        @JsonProperty("stck_prpr")
        private String currentPrice; // 주식 현재가

        @JsonProperty("prdy_vrss")
        private String changeAmount; // 전일 대비

        @JsonProperty("prdy_ctrt")
        private String changeRate; // 전일 대비율

        @JsonProperty("stck_sdpr")
        private String prevClose; // 전일 종가

        @JsonProperty("stck_oprc")
        private String openPrice; // 시가

        @JsonProperty("stck_hgpr")
        private String highPrice; // 당일 최고가

        @JsonProperty("stck_lwpr")
        private String lowPrice; // 당일 최저가

        @JsonProperty("acml_vol")
        private String volume; // 누적 거래량

        @JsonProperty("acml_tr_pbmn")
        private String tradeValue; // 누적 거래대금
    }
}
