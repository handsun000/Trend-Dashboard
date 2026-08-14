package com.trend.backend.batch;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpbitMarketDto {
    private String market;
    
    @JsonProperty("korean_name")
    private String koreanName;
    
    @JsonProperty("english_name")
    private String englishName;
}
