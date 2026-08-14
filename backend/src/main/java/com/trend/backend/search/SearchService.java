package com.trend.backend.search;

import com.trend.backend.batch.UpbitApiClient;
import com.trend.backend.batch.UpbitMarketDto;
import com.trend.backend.elasticsearch.StockDocument;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ElasticsearchOperations elasticsearchOperations;
    private final UpbitApiClient upbitApiClient;

    private final List<SearchResponseDto> catalog = new CopyOnWriteArrayList<>();

    private static final List<SearchResponseDto> DOMESTIC_STOCKS = List.of(
            // 대형 대표주 & 반도체
            new SearchResponseDto("005930", "삼성전자", "KOSPI"),
            new SearchResponseDto("000660", "SK하이닉스", "KOSPI"),
            new SearchResponseDto("373220", "LG에너지솔루션", "KOSPI"),
            new SearchResponseDto("207940", "삼성바이오로직스", "KOSPI"),
            new SearchResponseDto("005380", "현대차", "KOSPI"),
            new SearchResponseDto("000270", "기아", "KOSPI"),
            new SearchResponseDto("068270", "셀트리온", "KOSPI"),
            new SearchResponseDto("005490", "POSCO홀딩스", "KOSPI"),
            new SearchResponseDto("035420", "NAVER", "KOSPI"),
            new SearchResponseDto("035720", "카카오", "KOSPI"),
            new SearchResponseDto("051910", "LG화학", "KOSPI"),
            new SearchResponseDto("006400", "삼성SDI", "KOSPI"),
            new SearchResponseDto("012330", "현대모비스", "KOSPI"),
            new SearchResponseDto("028260", "삼성물산", "KOSPI"),
            new SearchResponseDto("105560", "KB금융", "KOSPI"),
            new SearchResponseDto("055550", "신한지주", "KOSPI"),
            new SearchResponseDto("323410", "카카오뱅크", "KOSPI"),
            new SearchResponseDto("377300", "카카오페이", "KOSPI"),
            new SearchResponseDto("259960", "크래프톤", "KOSPI"),
            new SearchResponseDto("034020", "두산에너빌리티", "KOSPI"),
            new SearchResponseDto("003670", "포스코퓨처엠", "KOSPI"),
            new SearchResponseDto("010130", "고려아연", "KOSPI"),
            new SearchResponseDto("015760", "한국전력", "KOSPI"),
            new SearchResponseDto("033780", "KT&G", "KOSPI"),
            new SearchResponseDto("011200", "HMM", "KOSPI"),
            new SearchResponseDto("012450", "한화에어로스페이스", "KOSPI"),
            new SearchResponseDto("096770", "SK이노베이션", "KOSPI"),
            new SearchResponseDto("036570", "엔씨소프트", "KOSPI"),
            new SearchResponseDto("263750", "펄어비스", "KOSDAQ"),
            new SearchResponseDto("352820", "하이브", "KOSPI"),
            new SearchResponseDto("035900", "JYP Ent.", "KOSDAQ"),
            new SearchResponseDto("041510", "에스엠", "KOSDAQ"),
            new SearchResponseDto("122870", "와이지엔터테인먼트", "KOSDAQ"),
            // 2차전지 & 코스닥 대표
            new SearchResponseDto("247540", "에코프로비엠", "KOSDAQ"),
            new SearchResponseDto("086520", "에코프로", "KOSDAQ"),
            new SearchResponseDto("196170", "알테오젠", "KOSDAQ"),
            new SearchResponseDto("028300", "HLB", "KOSDAQ"),
            new SearchResponseDto("403870", "HPSP", "KOSDAQ"),
            new SearchResponseDto("042700", "한미반도체", "KOSPI"),
            new SearchResponseDto("128940", "한미약품", "KOSPI"),
            new SearchResponseDto("000100", "유한양행", "KOSPI"),
            new SearchResponseDto("277810", "레인보우로보틱스", "KOSDAQ"),
            new SearchResponseDto("328130", "루닛", "KOSDAQ"),
            new SearchResponseDto("000250", "삼천당제약", "KOSDAQ"),
            new SearchResponseDto("141080", "리가켐바이오", "KOSDAQ"),
            new SearchResponseDto("009150", "삼성전기", "KOSPI"),
            new SearchResponseDto("066570", "LG전자", "KOSPI"),
            new SearchResponseDto("017670", "SK텔레콤", "KOSPI"),
            new SearchResponseDto("030200", "KT", "KOSPI"),
            new SearchResponseDto("032640", "LG유플러스", "KOSPI"),
            new SearchResponseDto("097950", "CJ제일제당", "KOSPI"),
            new SearchResponseDto("090430", "아모레퍼시픽", "KOSPI"),
            new SearchResponseDto("051900", "LG생활건강", "KOSPI"),
            new SearchResponseDto("003490", "대한항공", "KOSPI"),
            new SearchResponseDto("030000", "제일기획", "KOSPI"),
            new SearchResponseDto("005830", "DB손해보험", "KOSPI")
    );

    @PostConstruct
    public void initCatalog() {
        // 1. Add domestic stocks
        catalog.addAll(DOMESTIC_STOCKS);

        // 2. Fetch live all crypto markets from Upbit API
        try {
            List<UpbitMarketDto> upbitMarkets = upbitApiClient.fetchAllMarkets();
            if (upbitMarkets != null && !upbitMarkets.isEmpty()) {
                for (UpbitMarketDto m : upbitMarkets) {
                    if (m.getMarket().startsWith("KRW-")) {
                        catalog.add(new SearchResponseDto(m.getMarket(), m.getKoreanName(), "CRYPTO"));
                    }
                }
                log.info("Loaded {} Upbit KRW market coins into search catalog", catalog.size() - DOMESTIC_STOCKS.size());
            } else {
                addFallbackCrypto();
            }
        } catch (Exception e) {
            log.warn("Failed to load Upbit markets dynamically. Adding fallback crypto list: {}", e.getMessage());
            addFallbackCrypto();
        }
    }

    private void addFallbackCrypto() {
        catalog.add(new SearchResponseDto("KRW-BTC", "비트코인", "CRYPTO"));
        catalog.add(new SearchResponseDto("KRW-ETH", "이더리움", "CRYPTO"));
        catalog.add(new SearchResponseDto("KRW-XRP", "리플", "CRYPTO"));
        catalog.add(new SearchResponseDto("KRW-SOL", "솔라나", "CRYPTO"));
        catalog.add(new SearchResponseDto("KRW-DOGE", "도지코인", "CRYPTO"));
        catalog.add(new SearchResponseDto("KRW-ADA", "에이다", "CRYPTO"));
        catalog.add(new SearchResponseDto("KRW-AVAX", "아발란체", "CRYPTO"));
        catalog.add(new SearchResponseDto("KRW-SHIB", "시바이누", "CRYPTO"));
    }

    public List<SearchResponseDto> searchStocks(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        String trimmed = keyword.trim();
        String lowerKeyword = trimmed.toLowerCase();

        // 1. If Elasticsearch is available, try searching index first
        try {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q.multiMatch(m -> m
                            .fields("name", "ticker")
                            .query(trimmed)
                    ))
                    .withPageable(PageRequest.of(0, 15))
                    .build();

            SearchHits<StockDocument> searchHits = elasticsearchOperations.search(query, StockDocument.class);

            if (searchHits.hasSearchHits()) {
                return searchHits.getSearchHits().stream()
                        .map(SearchHit::getContent)
                        .map(doc -> new SearchResponseDto(doc.getTicker(), doc.getName(), doc.getMarket()))
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.debug("Elasticsearch query bypassed: {}", e.getMessage());
        }

        // 2. Comprehensive in-memory catalog search (Korean name or Ticker code)
        List<SearchResponseDto> matched = catalog.stream()
                .filter(s -> s.getName().toLowerCase().contains(lowerKeyword) 
                          || s.getTicker().toLowerCase().contains(lowerKeyword)
                          || s.getTicker().replace("KRW-", "").toLowerCase().contains(lowerKeyword))
                .limit(15)
                .collect(Collectors.toList());

        // 3. Dynamic Fallback for ANY 6-digit stock code (e.g. 012330, 003490)
        if (matched.isEmpty() && trimmed.matches("^\\d{6}$")) {
            return List.of(new SearchResponseDto(trimmed, "국내주식 (" + trimmed + ")", "KOSPI"));
        }

        return matched;
    }
}
