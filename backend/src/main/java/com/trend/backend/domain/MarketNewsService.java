package com.trend.backend.domain;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@lombok.RequiredArgsConstructor
public class MarketNewsService {

    private final GeminiAiService geminiAiService;

    private static final List<String> POSITIVE_KEYWORDS = List.of(
            "상승", "급등", "최고", "호조", "흑자", "돌파", "순매수", "호실적", "성장",
            "혁신", "반등", "유입", "랠리", "낙관", "기대", "상향", "독점", "협력", "서프라이즈", "강세"
    );

    private static final List<String> NEGATIVE_KEYWORDS = List.of(
            "하락", "급락", "최저", "폭락", "적자", "이탈", "순매도", "경계", "충격",
            "위기", "둔화", "규제", "소송", "붕괴", "불확실", "악재", "하향", "손실", "약세"
    );

    public MarketNewsDto.NewsResponse getNewsForTicker(String ticker, String name) {
        String queryTerm = resolveSearchQuery(ticker, name);
        String displayName = (name != null && !name.trim().isEmpty()) ? name : queryTerm;

        List<MarketNewsDto.NewsItem> items = fetchLiveGoogleNewsRss(queryTerm, ticker, displayName);

        // Gemini AI / Rule-Engine 감성 분석 및 3줄 브리핑 수행
        GeminiDto.AnalysisResult aiResult = geminiAiService.analyzeNewsWithAi(ticker, displayName, items);

        return MarketNewsDto.NewsResponse.builder()
                .ticker(ticker)
                .targetName(displayName)
                .overallSentimentScore(aiResult.getSentimentScore())
                .overallSentimentLabel(aiResult.getSentimentLabel())
                .aiInsight(aiResult.getComprehensiveSummary())
                .threeLineBriefing(aiResult.getThreeLineBriefing())
                .sectorImpactTags(aiResult.getSectorImpactTags())
                .aiModel("Gemini 1.5 Flash")
                .cached(true)
                .newsList(items)
                .build();
    }

    private List<MarketNewsDto.NewsItem> fetchLiveGoogleNewsRss(String queryTerm, String ticker, String displayName) {
        List<MarketNewsDto.NewsItem> items = new ArrayList<>();
        HttpURLConnection conn = null;

        try {
            String encodedQuery = URLEncoder.encode(queryTerm, StandardCharsets.UTF_8);
            String urlStr = "https://news.google.com/rss/search?q=" + encodedQuery + "&hl=ko&gl=KR&ceid=KR:ko";
            URL url = URI.create(urlStr).toURL();

            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(5000);

            int status = conn.getResponseCode();
            if (status != 200) {
                log.warn("Google News RSS returned HTTP status: {} for query: {}", status, queryTerm);
                return items;
            }

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();

            try (InputStream in = conn.getInputStream()) {
                Document doc = builder.parse(in);
                NodeList itemList = doc.getElementsByTagName("item");

                int maxItems = Math.min(itemList.getLength(), 10);
                for (int i = 0; i < maxItems; i++) {
                    Element item = (Element) itemList.item(i);
                    String rawTitle = getTagValue("title", item);
                    String link = getTagValue("link", item);
                    String pubDate = getTagValue("pubDate", item);
                    String source = getTagValue("source", item);
                    String description = stripHtml(getTagValue("description", item));

                    // Title & source parsing (Google News usually formats title as "Article Title - Media Name")
                    String cleanTitle = rawTitle;
                    if (source.isBlank() && rawTitle.contains(" - ")) {
                        int lastDash = rawTitle.lastIndexOf(" - ");
                        cleanTitle = rawTitle.substring(0, lastDash).trim();
                        source = rawTitle.substring(lastDash + 3).trim();
                    } else if (rawTitle.contains(" - ")) {
                        int lastDash = rawTitle.lastIndexOf(" - ");
                        cleanTitle = rawTitle.substring(0, lastDash).trim();
                    }

                    if (source.isBlank()) source = "실시간 금융뉴스";

                    // Sentiment Score & Analysis
                    SentimentResult sentiment = evaluateSentiment(cleanTitle + " " + description);

                    // Publication relative time formatting
                    String relativeTime = formatRelativeTime(pubDate);

                    // Impact tags derivation
                    List<String> tags = deriveImpactTags(cleanTitle, sentiment.sentiment);

                    items.add(MarketNewsDto.NewsItem.builder()
                            .id("live-news-" + i + "-" + Math.abs(cleanTitle.hashCode()))
                            .ticker(ticker)
                            .targetName(displayName)
                            .title(cleanTitle)
                            .source(source)
                            .publishedAt(relativeTime)
                            .sentiment(sentiment.sentiment)
                            .sentimentScore(sentiment.score)
                            .sentimentLabel(sentiment.label)
                            .summary(description.isBlank() ? cleanTitle : description)
                            .impactTags(tags)
                            .url(link)
                            .build());
                }
            }

        } catch (Exception e) {
            log.warn("Failed to fetch live RSS news for query '{}': {}", queryTerm, e.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }

        return items;
    }

    private SentimentResult evaluateSentiment(String text) {
        if (text == null) return new SentimentResult("NEUTRAL", 50, "중립 ⚪");

        int posCount = 0;
        int negCount = 0;

        for (String kw : POSITIVE_KEYWORDS) {
            if (text.contains(kw)) posCount++;
        }
        for (String kw : NEGATIVE_KEYWORDS) {
            if (text.contains(kw)) negCount++;
        }

        int score = 50 + (posCount * 14) - (negCount * 14);
        score = Math.max(5, Math.min(95, score));

        String sentiment;
        String label;

        if (score >= 65) {
            sentiment = "POSITIVE";
            label = score >= 80 ? "강한 호재 🟢" : "호재 🟢";
        } else if (score <= 40) {
            sentiment = "NEGATIVE";
            label = score <= 25 ? "강한 악재 🔴" : "주의/경계 🔴";
        } else {
            sentiment = "NEUTRAL";
            label = "중립/관망 ⚪";
        }

        return new SentimentResult(sentiment, score, label);
    }

    private List<String> deriveImpactTags(String title, String sentiment) {
        List<String> tags = new ArrayList<>();
        if (title.contains("실적") || title.contains("영업익") || title.contains("매출")) tags.add("#실적공시");
        if (title.contains("외국인") || title.contains("기관") || title.contains("수급")) tags.add("#수급동향");
        if (title.contains("ETF") || title.contains("펀드")) tags.add("#ETF수급");
        if (title.contains("금리") || title.contains("연준") || title.contains("환율")) tags.add("#거시경제");
        if (title.contains("AI") || title.contains("반도체") || title.contains("HBM")) tags.add("#AI반도체");
        if (title.contains("비트코인") || title.contains("가상자산") || title.contains("코인")) tags.add("#온체인");
        if (title.contains("신고가") || title.contains("급등") || title.contains("돌파")) tags.add("#모멘텀");

        if (tags.isEmpty()) {
            tags.add("POSITIVE".equals(sentiment) ? "#호재뉴스" : ("NEGATIVE".equals(sentiment) ? "#리스크점검" : "#시장동향"));
            tags.add("#실시간속보");
        }

        return tags;
    }

    private String formatRelativeTime(String pubDateStr) {
        if (pubDateStr == null || pubDateStr.isBlank()) return "방금 전";
        try {
            ZonedDateTime zdt = ZonedDateTime.parse(pubDateStr, DateTimeFormatter.RFC_1123_DATE_TIME);
            ZonedDateTime now = ZonedDateTime.now(zdt.getZone());
            long minutes = ChronoUnit.MINUTES.between(zdt, now);
            if (minutes < 1) return "방금 전";
            if (minutes < 60) return minutes + "분 전";
            long hours = ChronoUnit.HOURS.between(zdt, now);
            if (hours < 24) return hours + "시간 전";
            long days = ChronoUnit.DAYS.between(zdt, now);
            return days + "일 전";
        } catch (Exception e) {
            return "최신";
        }
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", "").replaceAll("&nbsp;", " ").replaceAll("&quot;", "\"").replaceAll("&amp;", "&").trim();
    }

    private String getTagValue(String tag, Element element) {
        NodeList nl = element.getElementsByTagName(tag);
        if (nl != null && nl.getLength() > 0 && nl.item(0) != null) {
            return nl.item(0).getTextContent().trim();
        }
        return "";
    }

    private String resolveSearchQuery(String ticker, String name) {
        if (name != null && !name.trim().isEmpty()) {
            return name.trim();
        }
        if (ticker == null) return "증시";

        String t = ticker.toUpperCase();
        if (t.contains("BTC") || t.contains("비트코인")) return "비트코인";
        if (t.contains("ETH") || t.contains("이더리움")) return "이더리움";
        if (t.contains("XRP") || t.contains("리플")) return "리플 XRP";
        if (t.contains("SOL") || t.contains("솔라나")) return "솔라나 코인";
        if (t.contains("DOGE") || t.contains("도지")) return "도지코인";
        if (t.equals("005930")) return "삼성전자";
        if (t.equals("000660")) return "SK하이닉스";
        if (t.equals("035420")) return "NAVER";
        if (t.equals("035720")) return "카카오";
        if (t.equals("005380")) return "현대차";

        return ticker;
    }

    private static class SentimentResult {
        final String sentiment;
        final int score;
        final String label;

        SentimentResult(String sentiment, int score, String label) {
            this.sentiment = sentiment;
            this.score = score;
            this.label = label;
        }
    }
}
