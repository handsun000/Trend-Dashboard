package com.trend.backend.elasticsearch;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockDocumentRepository extends ElasticsearchRepository<StockDocument, String> {
}
