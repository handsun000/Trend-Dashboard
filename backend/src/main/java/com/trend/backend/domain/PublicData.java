package com.trend.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "public_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category;      // REAL_ESTATE, MACRO, WEATHER_CONSUMPTION
    private String subCategory;   // e.g. SEOUL, NATIONWIDE, BOK_RATE, FED_RATE, CPI, PPI, FNB, DELIVERY
    private String title;
    
    @Column(name = "data_value")
    private Double value;
    
    private String unit;          // %, pt, 억원, ℃, mm
    
    @Column(name = "change_rate")
    private Double changeRate;    // 변동률 (전월대비 등)
    
    @Column(name = "reference_date")
    private LocalDate referenceDate;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

