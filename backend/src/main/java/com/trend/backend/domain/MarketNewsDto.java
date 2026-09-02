package com.trend.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class MarketNewsDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NewsItem {
        private String id;
        private String ticker;
        private String targetName;
        private String title;
        private String source;
        private String publishedAt;
        private String sentiment;        // POSITIVE, NEGATIVE, NEUTRAL
        private int sentimentScore;      // -100 ~ +100
        private String sentimentLabel;
        private String summary;
        private List<String> impactTags;
        private String url;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NewsResponse {
        private String ticker;
        private String targetName;
        private int overallSentimentScore;
        private String overallSentimentLabel;
        private String aiInsight;
        private List<String> threeLineBriefing;
        private List<String> sectorImpactTags;
        private String aiModel;
        private boolean cached;
        private List<NewsItem> newsList;
    }
}
