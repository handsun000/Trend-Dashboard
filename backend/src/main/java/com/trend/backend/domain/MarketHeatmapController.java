package com.trend.backend.domain;

import com.trend.backend.batch.KisApiClient;
import com.trend.backend.batch.UpbitApiClient;
import com.trend.backend.batch.UpbitTickerDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/market/heatmap")
@RequiredArgsConstructor
public class MarketHeatmapController {

    private final UpbitApiClient upbitApiClient;
    private final KisApiClient kisApiClient;

    @GetMapping
    public ResponseEntity<MarketHeatmapDto.HeatmapResponse> getHeatmap(
            @RequestParam(defaultValue = "STOCKS") String type) {
        
        if ("CRYPTO".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(generateCryptoHeatmap());
        } else {
            return ResponseEntity.ok(generateStockHeatmap());
        }
    }

    private MarketHeatmapDto.HeatmapResponse generateStockHeatmap() {
        List<MarketHeatmapDto.SectorGroup> sectors = new ArrayList<>();

        // 1. 반도체 & AI
        sectors.add(MarketHeatmapDto.SectorGroup.builder()
                .sectorName("반도체 / AI 하드웨어")
                .averageChangeRate(1.85)
                .items(List.of(
                        MarketHeatmapDto.HeatmapItem.builder().ticker("005930").name("삼성전자").sector("반도체").market("KOSPI").price(78500).changeRate(1.42).marketCap(468000000000000L).tradeVolume(1240000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("000660").name("SK하이닉스").sector("반도체").market("KOSPI").price(194500).changeRate(3.18).marketCap(141000000000000L).tradeVolume(980000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("042700").name("한미반도체").sector("반도체").market("KOSPI").price(148000).changeRate(4.25).marketCap(14400000000000L).tradeVolume(430000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("039030").name("이오테크닉스").sector("반도체").market("KOSDAQ").price(210000).changeRate(-0.94).marketCap(2600000000000L).tradeVolume(110000000000L).build()
                ))
                .build());

        // 2. 2차전지 & 친환경
        sectors.add(MarketHeatmapDto.SectorGroup.builder()
                .sectorName("2차전지 / 배터리")
                .averageChangeRate(-1.12)
                .items(List.of(
                        MarketHeatmapDto.HeatmapItem.builder().ticker("373220").name("LG에너지솔루션").sector("2차전지").market("KOSPI").price(382000).changeRate(-0.78).marketCap(89400000000000L).tradeVolume(320000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("005490").name("POSCO홀딩스").sector("2차전지").market("KOSPI").price(354000).changeRate(0.57).marketCap(29900000000000L).tradeVolume(210000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("247540").name("에코프로비엠").sector("2차전지").market("KOSDAQ").price(182000).changeRate(-2.67).marketCap(17800000000000L).tradeVolume(190000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("086520").name("에코프로").sector("2차전지").market("KOSDAQ").price(89000).changeRate(-1.65).marketCap(11800000000000L).tradeVolume(140000000000L).build()
                ))
                .build());

        // 3. 바이오 & 제약
        sectors.add(MarketHeatmapDto.SectorGroup.builder()
                .sectorName("바이오 / 헬스케어")
                .averageChangeRate(2.40)
                .items(List.of(
                        MarketHeatmapDto.HeatmapItem.builder().ticker("207940").name("삼성바이오로직스").sector("바이오").market("KOSPI").price(982000).changeRate(2.83).marketCap(69900000000000L).tradeVolume(350000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("068270").name("셀트리온").sector("바이오").market("KOSPI").price(198500).changeRate(1.28).marketCap(43300000000000L).tradeVolume(280000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("196170").name("알테오젠").sector("바이오").market("KOSDAQ").price(318000).changeRate(4.60).marketCap(16900000000000L).tradeVolume(410000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("028300").name("에이치엘비").sector("바이오").market("KOSDAQ").price(87500).changeRate(0.92).marketCap(11400000000000L).tradeVolume(160000000000L).build()
                ))
                .build());

        // 4. IT & 플랫폼 & 엔터
        sectors.add(MarketHeatmapDto.SectorGroup.builder()
                .sectorName("IT / 플랫폼 / 게임")
                .averageChangeRate(0.65)
                .items(List.of(
                        MarketHeatmapDto.HeatmapItem.builder().ticker("035420").name("NAVER").sector("플랫폼").market("KOSPI").price(168500).changeRate(1.14).marketCap(27300000000000L).tradeVolume(220000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("035720").name("카카오").sector("플랫폼").market("KOSPI").price(37800).changeRate(-0.53).marketCap(16800000000000L).tradeVolume(180000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("259960").name("크래프톤").sector("게임").market("KOSPI").price(342000).changeRate(2.09).marketCap(16500000000000L).tradeVolume(130000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("352820").name("하이브").sector("엔터").market("KOSPI").price(179000).changeRate(-0.11).marketCap(7400000000000L).tradeVolume(89000000000L).build()
                ))
                .build());

        // 5. 자동차 & 모빌리티
        sectors.add(MarketHeatmapDto.SectorGroup.builder()
                .sectorName("자동차 / 모빌리티")
                .averageChangeRate(1.30)
                .items(List.of(
                        MarketHeatmapDto.HeatmapItem.builder().ticker("005380").name("현대차").sector("자동차").market("KOSPI").price(238500).changeRate(1.49).marketCap(49800000000000L).tradeVolume(310000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("000270").name("기아").sector("자동차").market("KOSPI").price(104800).changeRate(1.16).marketCap(41800000000000L).tradeVolume(240000000000L).build()
                ))
                .build());

        // 6. 금융 & 지주
        sectors.add(MarketHeatmapDto.SectorGroup.builder()
                .sectorName("금융 / 밸류업")
                .averageChangeRate(0.85)
                .items(List.of(
                        MarketHeatmapDto.HeatmapItem.builder().ticker("105560").name("KB금융").sector("금융").market("KOSPI").price(86900).changeRate(1.28).marketCap(34900000000000L).tradeVolume(190000000000L).build(),
                        MarketHeatmapDto.HeatmapItem.builder().ticker("055550").name("신한지주").sector("금융").market("KOSPI").price(54800).changeRate(0.55).marketCap(27600000000000L).tradeVolume(140000000000L).build()
                ))
                .build());

        return MarketHeatmapDto.HeatmapResponse.builder()
                .marketType("STOCKS")
                .sectors(sectors)
                .updatedAt(System.currentTimeMillis())
                .build();
    }

    private MarketHeatmapDto.HeatmapResponse generateCryptoHeatmap() {
        List<MarketHeatmapDto.SectorGroup> sectors = new ArrayList<>();

        try {
            // Fetch live data from Upbit API for major markets
            String markets = "KRW-BTC,KRW-ETH,KRW-XRP,KRW-SOL,KRW-DOGE,KRW-ADA,KRW-AVAX,KRW-DOT,KRW-SHIB,KRW-NEAR,KRW-LINK,KRW-SUI";
            List<UpbitTickerDto> tickers = upbitApiClient.fetchRealtimeTickers(markets);

            Map<String, UpbitTickerDto> tickerMap = new HashMap<>();
            if (tickers != null) {
                for (UpbitTickerDto t : tickers) {
                    tickerMap.put(t.getMarket(), t);
                }
            }

            // Layer 1 / Store of Value
            sectors.add(MarketHeatmapDto.SectorGroup.builder()
                    .sectorName("메이저 & 레이어 1 (Layer 1)")
                    .averageChangeRate(1.2)
                    .items(List.of(
                            createCryptoItem("KRW-BTC", "비트코인", "레이어 1", 1300000000000000L, tickerMap),
                            createCryptoItem("KRW-ETH", "이더리움", "레이어 1", 450000000000000L, tickerMap),
                            createCryptoItem("KRW-SOL", "솔라나", "레이어 1", 110000000000000L, tickerMap),
                            createCryptoItem("KRW-ADA", "에이다", "레이어 1", 28000000000000L, tickerMap),
                            createCryptoItem("KRW-AVAX", "아발란체", "레이어 1", 19000000000000L, tickerMap),
                            createCryptoItem("KRW-SUI", "수이", "레이어 1", 12000000000000L, tickerMap)
                    ))
                    .build());

            // Payments & DeFi & Meme
            sectors.add(MarketHeatmapDto.SectorGroup.builder()
                    .sectorName("결제 & 디파이 & 밈 (Payments & Meme)")
                    .averageChangeRate(2.8)
                    .items(List.of(
                            createCryptoItem("KRW-XRP", "리플", "결제망", 48000000000000L, tickerMap),
                            createCryptoItem("KRW-DOGE", "도지코인", "밈 코인", 29000000000000L, tickerMap),
                            createCryptoItem("KRW-SHIB", "시바이누", "밈 코인", 14000000000000L, tickerMap),
                            createCryptoItem("KRW-LINK", "체인링크", "오라클", 11000000000000L, tickerMap),
                            createCryptoItem("KRW-NEAR", "니어프로토콜", "AI & L1", 9500000000000L, tickerMap),
                            createCryptoItem("KRW-DOT", "폴카닷", "인터체인", 8900000000000L, tickerMap)
                    ))
                    .build());

        } catch (Exception e) {
            log.error("Failed to generate live crypto heatmap: {}", e.getMessage());
        }

        return MarketHeatmapDto.HeatmapResponse.builder()
                .marketType("CRYPTO")
                .sectors(sectors)
                .updatedAt(System.currentTimeMillis())
                .build();
    }

    private MarketHeatmapDto.HeatmapItem createCryptoItem(String market, String name, String sector, long defaultCap, Map<String, UpbitTickerDto> tickerMap) {
        UpbitTickerDto dto = tickerMap.get(market);
        double price = (dto != null && dto.getTradePrice() != null) ? dto.getTradePrice() : 0.0;
        double changeRate = (dto != null && dto.getSignedChangeRate() != null) ? Math.round(dto.getSignedChangeRate() * 10000.0) / 100.0 : 0.0;
        long volume = (dto != null && dto.getAccTradePrice24h() != null) ? dto.getAccTradePrice24h().longValue() : 0L;

        return MarketHeatmapDto.HeatmapItem.builder()
                .ticker(market)
                .name(name)
                .sector(sector)
                .market("CRYPTO")
                .price(price)
                .changeRate(changeRate)
                .marketCap(defaultCap)
                .tradeVolume(volume)
                .build();
    }
}
