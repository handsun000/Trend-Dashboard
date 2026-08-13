package com.trend.backend.alert;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserAlertRequestDto {
    private String userId = "user1";
    private String ticker;
    private Double targetPrice;
}
