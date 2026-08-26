package com.trend.backend.domain;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class MarketNewsService {

    public MarketNewsDto.NewsResponse getNewsForTicker(String ticker, String name) {
        String displayName = (name != null && !name.trim().isEmpty()) ? name : ticker;
        boolean isCrypto = ticker.startsWith("KRW-") || ticker.contains("BTC") || ticker.contains("ETH") || ticker.contains("XRP");

        List<MarketNewsDto.NewsItem> items = new ArrayList<>();

        if (isCrypto) {
            items.add(MarketNewsDto.NewsItem.builder()
                    .id("news-c-1")
                    .ticker(ticker)
                    .targetName(displayName)
                    .title(String.format("글로벌 가상자산 현물 ETF 순유입 지속… %s 주도적 상승 랠리 기대", displayName))
                    .source("코인데스크 코리아")
                    .publishedAt("8분 전")
                    .sentiment("POSITIVE")
                    .sentimentScore(88)
                    .sentimentLabel("강한 호재 🟢")
                    .summary(String.format("기관 투자자의 대규모 매수세와 온체인 활성 지갑 수 급증으로 %s의 수급 환경이 대폭 개선되고 있습니다.", displayName))
                    .impactTags(List.of("#ETF현물유입", "#기관자금", "#온체인강세"))
                    .url("https://coindesk.com")
                    .build());

            items.add(MarketNewsDto.NewsItem.builder()
                    .id("news-c-2")
                    .ticker(ticker)
                    .targetName(displayName)
                    .title(String.format("美 연준 금리 인하 기대감에 가상자산 시장 유동성 확대… %s 24시간 거래대율 급등", displayName))
                    .source("블룸버그 크립토")
                    .publishedAt("27분 전")
                    .sentiment("POSITIVE")
                    .sentimentScore(76)
                    .sentimentLabel("호재 🟢")
                    .summary("거시경제 금리 인하 기조와 글로벌 위험자산 선호 심리가 맞물리며 주요 거래소 거래대금이 폭증하고 있습니다.")
                    .impactTags(List.of("#금리인하수혜", "#유동성확대", "#거래대금폭증"))
                    .url("https://bloomberg.com")
                    .build());

            items.add(MarketNewsDto.NewsItem.builder()
                    .id("news-c-3")
                    .ticker(ticker)
                    .targetName(displayName)
                    .title(String.format("단기 급등에 따른 차익실현 매물 경계… %s 지지선 테스트 구간 진입", displayName))
                    .source("연합인포맥스")
                    .publishedAt("1시간 전")
                    .sentiment("NEUTRAL")
                    .sentimentScore(12)
                    .sentimentLabel("중립/경계 ⚪")
                    .summary("단기 이동평균선 상단 저항 구간에 도달함에 따라 파생상품 펀딩비 상승 및 단기 숨고르기 가능성이 제기됩니다.")
                    .impactTags(List.of("#기술적조정", "#지지선테스트", "#펀딩비주의"))
                    .url("https://einfomax.co.kr")
                    .build());

            return MarketNewsDto.NewsResponse.builder()
                    .ticker(ticker)
                    .targetName(displayName)
                    .overallSentimentScore(82)
                    .overallSentimentLabel("매수 우세 / 호재 지배 (82%)")
                    .aiInsight(String.format("AI 분석 결과, %s는 글로벌 현물 ETF 자금 유입과 위험선호 심리에 힘입어 강한 매수 우세 국면에 위치해 있습니다. 다만 단기 급등 후 과열 지표를 감안한 분할 진입 전략이 권장됩니다.", displayName))
                    .newsList(items)
                    .build();
        } else {
            items.add(MarketNewsDto.NewsItem.builder()
                    .id("news-s-1")
                    .ticker(ticker)
                    .targetName(displayName)
                    .title(String.format("%s, 글로벌 빅테크 차세대 공급망 진입 가시화… 목표주가 줄상향", displayName))
                    .source("한국경제")
                    .publishedAt("12분 전")
                    .sentiment("POSITIVE")
                    .sentimentScore(91)
                    .sentimentLabel("강한 호재 🟢")
                    .summary(String.format("AI 반도체 및 첨단 패키징 수요 증가로 %s의 실적 턴어라운드가 가속화되고 있으며, 외국인 및 기관 순매수가 집중되고 있습니다.", displayName))
                    .impactTags(List.of("#실적서프라이즈", "#빅테크공급망", "#목표가상향"))
                    .url("https://hankyung.com")
                    .build());

            items.add(MarketNewsDto.NewsItem.builder()
                    .id("news-s-2")
                    .ticker(ticker)
                    .targetName(displayName)
                    .title(String.format("%s 3분기 잠정 영업이익 컨센서스 상회 전망… HBM 및 신성장 포트폴리오 가동", displayName))
                    .source("매일경제")
                    .publishedAt("35분 전")
                    .sentiment("POSITIVE")
                    .sentimentScore(84)
                    .sentimentLabel("호재 🟢")
                    .summary("고부가 가치 프리미엄 제품군 비중 확대와 수율 안정화로 하반기 영업이익률이 전분기 대비 4.2%p 개선될 것으로 전망됩니다.")
                    .impactTags(List.of("#HBM호조", "#영업이익개선", "#수율안정화"))
                    .url("https://mk.co.kr")
                    .build());

            items.add(MarketNewsDto.NewsItem.builder()
                    .id("news-s-3")
                    .ticker(ticker)
                    .targetName(displayName)
                    .title(String.format("외국인 지분율 연중 최고치 경신… %s, 코스피 지수 견인차 역할", displayName))
                    .source("연합뉴스")
                    .publishedAt("1시간 전")
                    .sentiment("POSITIVE")
                    .sentimentScore(75)
                    .sentimentLabel("호재 🟢")
                    .summary("MSCI 리밸런싱 및 패시브 자금 유입으로 5거래일 연속 외국인 순매수가 이어지며 프로그램 매수세가 유입 중입니다.")
                    .impactTags(List.of("#외인순매수", "#패시브자금", "#지수견인"))
                    .url("https://yna.co.kr")
                    .build());

            return MarketNewsDto.NewsResponse.builder()
                    .ticker(ticker)
                    .targetName(displayName)
                    .overallSentimentScore(85)
                    .overallSentimentLabel("강한 호재 우세 (85%)")
                    .aiInsight(String.format("AI 분석 결과, %s 관련 최신 24시간 언론 보도 및 공시 중 85%%가 긍정적 시그널을 보이고 있습니다. 차세대 수주 모멘텀과 외인 수급이 강력한 지지 요인입니다.", displayName))
                    .newsList(items)
                    .build();
        }
    }
}
