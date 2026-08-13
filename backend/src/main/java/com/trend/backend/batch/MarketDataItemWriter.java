package com.trend.backend.batch;

import com.trend.backend.domain.StockHistory;
import com.trend.backend.domain.StockHistoryRepository;
import com.trend.backend.elasticsearch.StockDocument;
import com.trend.backend.elasticsearch.StockDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class MarketDataItemWriter implements ItemWriter<StockHistory> {

    private final StockHistoryRepository stockHistoryRepository;
    private final StockDocumentRepository stockDocumentRepository;

    @Override
    public void write(Chunk<? extends StockHistory> chunk) throws Exception {
        List<? extends StockHistory> items = chunk.getItems();
        
        // 1. Save to DB
        stockHistoryRepository.saveAll(items);
        
        // 2. Sync to Elasticsearch (safely)
        try {
            List<StockDocument> docs = items.stream().map(item -> {
                StockDocument doc = new StockDocument();
                doc.setTicker(item.getTicker());
                doc.setName("Mock Name " + item.getTicker()); 
                doc.setMarket(item.getTicker().contains("KRW") ? "CRYPTO" : "KOSPI");
                return doc;
            }).collect(Collectors.toList());
            
            stockDocumentRepository.saveAll(docs);
        } catch (Exception e) {
            log.warn("Elasticsearch unavailable for sync: {}", e.getMessage());
        }
    }
}
