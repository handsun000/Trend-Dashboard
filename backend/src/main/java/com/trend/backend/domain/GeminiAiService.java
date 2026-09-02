package com.trend.backend.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class GeminiAiService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    // 15-minute TTL In-Memory Cache to protect Gemini Free Tier quota (15 RPM / 1500 RPD)
    private final Map<String, CachedAnalysis> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_SECONDS = 900; // 15 minutes

    private static class CachedAnalysis {
        final GeminiDto.AnalysisResult result;
        final Instant cachedAt;

        CachedAnalysis(GeminiDto.AnalysisResult result) {
            this.result = result;
            this.cachedAt = Instant.now();
        }

        boolean isExpired() {
            return Instant.now().isAfter(cachedAt.plusSeconds(CACHE_TTL_SECONDS));
        }
    }

    public GeminiDto.AnalysisResult analyzeNewsWithAi(String ticker, String targetName, List<MarketNewsDto.NewsItem> newsItems) {
        String cacheKey = (ticker != null ? ticker.toUpperCase() : "UNKNOWN") + ":" + (targetName != null ? targetName.trim() : "");
        
        // Check cache
        CachedAnalysis cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            log.info("[Gemini AI] Cache HIT for key: {}", cacheKey);
            return cached.result;
        }

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("dummy") || newsItems == null || newsItems.isEmpty()) {
            log.info("[Gemini AI] API key not configured or news list empty. Generating rule-based AI analysis for {}", targetName);
            GeminiDto.AnalysisResult fallback = generateRuleBasedAnalysis(ticker, targetName, newsItems);
            cache.put(cacheKey, new CachedAnalysis(fallback));
            return fallback;
        }

        try {
            log.info("[Gemini AI] Calling Google Gemini 1.5 Flash API for {}", targetName);
            GeminiDto.AnalysisResult result = callGeminiApi(ticker, targetName, newsItems);
            cache.put(cacheKey, new CachedAnalysis(result));
            return result;
        } catch (Exception e) {
            log.warn("[Gemini AI] Error during Gemini API invocation: {}. Falling back to Rule-Engine.", e.getMessage());
            GeminiDto.AnalysisResult fallback = generateRuleBasedAnalysis(ticker, targetName, newsItems);
            cache.put(cacheKey, new CachedAnalysis(fallback));
            return fallback;
        }
    }

    private GeminiDto.AnalysisResult callGeminiApi(String ticker, String targetName, List<MarketNewsDto.NewsItem> newsItems) throws Exception {
        // Build news context
        StringBuilder newsContext = new StringBuilder();
        int limit = Math.min(newsItems.size(), 8);
        for (int i = 0; i < limit; i++) {
            MarketNewsDto.NewsItem item = newsItems.get(i);
            newsContext.append(String.format("[%d] %s (%s): %s\n", i + 1, item.getTitle(), item.getSource(), item.getSummary()));
        }

        String prompt = String.format("""
                당신은 월스트리트 및 여의도 최고의 금융 데이터 분석가 겸 AI 투자 전략가입니다.
                다음은 종목 [%s (%s)]에 대해 최근 24시간 내 수집된 실시간 뉴스 기사 목록입니다.
                
                기사 목록:
                %s
                
                위 기사들의 내용을 심층 분석하여 아래의 JSON 구조로만 정확하게 답변해 주세요.
                JSON 스키마:
                {
                  "sentimentScore": <0에서 100 사이의 정수, 50은 중립, 80이상은 강한 호재, 40이하는 악재/경계>,
                  "sentimentLabel": "<예: '강한 호재 우세 🟢 (82%%)' 또는 '단기 조정 경계 🔴 (35%%)' 등>",
                  "threeLineBriefing": [
                    "<첫 번째 핵심 팩트 및 주요 이슈 요약 1문장>",
                    "<두 번째 수급/실적/기술적 모멘텀 요약 1문장>",
                    "<세 번째 향후 시장 전망 및 투자자 유의점 요약 1문장>"
                  ],
                  "sectorImpactTags": ["<연관 섹터/테마 태그 1>", "<태그 2>", "<태그 3>", "<태그 4>"],
                  "comprehensiveSummary": "<전체적인 투자 심리 및 시장 영향도 1~2줄 종합 진단>"
                }
                """, targetName, ticker, newsContext.toString());

        Map<String, Object> requestBodyMap = new HashMap<>();
        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", List.of(Map.of("text", prompt)));
        requestBodyMap.put("contents", List.of(contentMap));

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.2);
        genConfig.put("responseMimeType", "application/json");
        requestBodyMap.put("generationConfig", genConfig);

        String jsonPayload = objectMapper.writeValueAsString(requestBodyMap);

        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey.trim();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API returned status: " + response.statusCode() + " body: " + response.body());
        }

        GeminiDto.Response geminiResponse = objectMapper.readValue(response.body(), GeminiDto.Response.class);
        if (geminiResponse.getCandidates() == null || geminiResponse.getCandidates().isEmpty()) {
            throw new RuntimeException("No candidates returned from Gemini");
        }

        String rawJson = geminiResponse.getCandidates().get(0).getContent().getParts().get(0).getText();
        log.debug("[Gemini AI] Raw AI Response: {}", rawJson);

        return objectMapper.readValue(rawJson, GeminiDto.AnalysisResult.class);
    }

    public GeminiDto.AnalysisResult generateRuleBasedAnalysis(String ticker, String targetName, List<MarketNewsDto.NewsItem> newsItems) {
        if (newsItems == null || newsItems.isEmpty()) {
            return GeminiDto.AnalysisResult.builder()
                    .sentimentScore(50)
                    .sentimentLabel("중립 및 관망세 ⚪ (50%)")
                    .threeLineBriefing(List.of(
                            String.format("현재 '%s' 관련 실시간 보도 기사가 집계되지 않았습니다.", targetName),
                            "주요 거래소 호가 및 실시간 틱 체결 흐름을 참고하시기 바랍니다.",
                            "신규 공시 및 속보가 발생하면 즉시 AI 분석이 갱신됩니다."
                    ))
                    .sectorImpactTags(List.of("데이터 집계중", "관망세", "모니터링"))
                    .comprehensiveSummary(String.format("'%s' 종목의 최근 기사 부재로 시장 관망세가 지속되고 있습니다.", targetName))
                    .build();
        }

        int totalScore = newsItems.stream().mapToInt(MarketNewsDto.NewsItem::getSentimentScore).sum();
        int avgScore = Math.max(10, Math.min(95, Math.round((float) totalScore / newsItems.size())));

        String label;
        if (avgScore >= 70) {
            label = String.format("강한 호재 우세 🟢 (%d%%)", avgScore);
        } else if (avgScore >= 55) {
            label = String.format("완만한 상승 모멘텀 🟢 (%d%%)", avgScore);
        } else if (avgScore <= 40) {
            label = String.format("단기 리스크 경계 🔴 (%d%%)", avgScore);
        } else {
            label = String.format("중립 및 수급 관망 ⚪ (%d%%)", avgScore);
        }

        long posCount = newsItems.stream().filter(i -> "POSITIVE".equals(i.getSentiment())).count();
        long negCount = newsItems.stream().filter(i -> "NEGATIVE".equals(i.getSentiment())).count();

        List<String> briefing = new ArrayList<>();
        briefing.add(String.format("최근 24시간 실시간 언론 보도 %d건 중 호재 %d건, 악재 %d건이 포착되었습니다.", newsItems.size(), posCount, negCount));
        if (!newsItems.isEmpty()) {
            briefing.add(String.format("주요 헤드라인: \"%s\" 등 시장 관심이 집중되고 있습니다.", newsItems.get(0).getTitle()));
        }
        briefing.add(avgScore >= 60 ? "기관 및 투자자들의 긍정적 매수 심리가 우세한 구간입니다." : "변동성 확대에 유의하며 분할 접근 및 리스크 관리가 권고됩니다.");

        List<String> tags = new ArrayList<>();
        if (ticker != null && ticker.startsWith("KRW-")) {
            tags.addAll(List.of("가상자산", "블록체인", "글로벌 유동성", "24H 거래"));
        } else {
            tags.addAll(List.of("국내증시", "실적 모멘텀", "수급 유입", "업종 대형주"));
        }

        return GeminiDto.AnalysisResult.builder()
                .sentimentScore(avgScore)
                .sentimentLabel(label)
                .threeLineBriefing(briefing)
                .sectorImpactTags(tags)
                .comprehensiveSummary(String.format("'%s' 종목은 현재 감성지수 %d점으로 %s 양상을 나타내고 있습니다.", targetName, avgScore, label))
                .build();
    }
}
