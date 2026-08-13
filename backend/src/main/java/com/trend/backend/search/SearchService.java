package com.trend.backend.search;

import com.trend.backend.elasticsearch.StockDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    private static final List<SearchResponseDto> MOCK_STOCKS = Arrays.asList(
            new SearchResponseDto("005930", "삼성전자", "KOSPI"),
            new SearchResponseDto("000660", "SK하이닉스", "KOSPI"),
            new SearchResponseDto("035420", "NAVER", "KOSPI"),
            new SearchResponseDto("KRW-BTC", "비트코인", "CRYPTO")
    );

    public List<SearchResponseDto> searchStocks(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        try {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q
                            .match(m -> m
                                    .field("name")
                                    .query(keyword)
                            )
                    )
                    .withPageable(PageRequest.of(0, 10))
                    .build();

            SearchHits<StockDocument> searchHits = elasticsearchOperations.search(query, StockDocument.class);

            if (searchHits.hasSearchHits()) {
                return searchHits.getSearchHits().stream()
                        .map(SearchHit::getContent)
                        .map(doc -> new SearchResponseDto(doc.getTicker(), doc.getName(), doc.getMarket()))
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("Elasticsearch unavailable. Falling back to mock search data. Error: {}", e.getMessage());
        }

        // Fallback filtering on mock data if ES is offline or returns empty
        String lowerKeyword = keyword.toLowerCase();
        return MOCK_STOCKS.stream()
                .filter(s -> s.getName().contains(keyword) || s.getTicker().toLowerCase().contains(lowerKeyword))
                .collect(Collectors.toList());
    }
}
