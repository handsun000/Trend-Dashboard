package com.trend.backend.client.gemini;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trend.backend.client.common.ExternalApiClient;
import com.trend.backend.client.common.ExternalApiHealth;
import com.trend.backend.client.config.ExternalApiProperties;
import com.trend.backend.domain.GeminiDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiApiClient implements ExternalApiClient {

    private final ExternalApiProperties.GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    public String getProviderName() {
        return "GEMINI";
    }

    @Override
    public boolean isConfigured() {
        return geminiProperties.isConfigured();
    }

    @Override
    public ExternalApiHealth checkHealth() {
        if (!isConfigured()) {
            return ExternalApiHealth.unconfigured("GEMINI", "Gemini API Key 미설정 (로컬 휴리스틱 감성 분석 엔진 동작)");
        }
        return ExternalApiHealth.healthy("GEMINI", "Google Gemini 1.5 Flash API 키 등록 완료", 0);
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "gemini", fallbackMethod = "fallbackGeminiContent")
    public String generateContentWithJsonSchema(String prompt) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("Gemini API Key is not configured");
        }


        Map<String, Object> requestBodyMap = new HashMap<>();
        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", List.of(Map.of("text", prompt)));
        requestBodyMap.put("contents", List.of(contentMap));

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.2);
        genConfig.put("responseMimeType", "application/json");
        requestBodyMap.put("generationConfig", genConfig);

        String jsonPayload = objectMapper.writeValueAsString(requestBodyMap);
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiProperties.getApiKey().trim();

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

        return geminiResponse.getCandidates().get(0).getContent().getParts().get(0).getText();
    }

    public String fallbackGeminiContent(String prompt, Throwable t) {
        log.warn("[Resilience4j] Gemini API CircuitBreaker fallback activated: {}", t.getMessage());
        throw new RuntimeException("Gemini API CircuitBreaker is OPEN or failed: " + t.getMessage(), t);
    }
}

