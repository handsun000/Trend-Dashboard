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

        @JsonProperty("acml_vol")
        private String volume; // 누적 거래량
    }
}
