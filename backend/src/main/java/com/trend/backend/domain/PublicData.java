package com.trend.backend.domain;

import jakarta.persistence.*;
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
public class PublicData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category;
    private String title;
    private Double value;
    
    @Column(name = "reference_date")
    private LocalDate referenceDate;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
