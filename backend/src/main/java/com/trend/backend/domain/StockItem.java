package com.trend.backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stock_item")
@Getter
@Setter
@NoArgsConstructor
public class StockItem {

    @Id
    private String ticker;

    private String name;
    
    private String market; // e.g., KOSPI, CRYPTO
}
