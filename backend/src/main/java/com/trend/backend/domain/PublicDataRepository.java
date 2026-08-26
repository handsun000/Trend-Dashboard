package com.trend.backend.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicDataRepository extends JpaRepository<PublicData, Long> {
    List<PublicData> findByCategoryOrderByReferenceDateAsc(String category);
    List<PublicData> findByCategoryAndSubCategoryOrderByReferenceDateAsc(String category, String subCategory);
    List<PublicData> findByCategory(String category);
}

