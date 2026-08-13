package com.trend.backend.search;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SearchResponseDto {
    private String ticker;
    private String name;
    private String market;
}
