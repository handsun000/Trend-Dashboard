package com.trend.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_alert")
@Getter
@Setter
@NoArgsConstructor
public class UserAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;
    
    private String ticker;
    
    @Column(name = "target_price")
    private Double targetPrice;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
}
