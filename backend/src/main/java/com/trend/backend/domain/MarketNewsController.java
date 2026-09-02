package com.trend.backend.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/news", "/api/v1/market/news"})
@RequiredArgsConstructor
public class MarketNewsController {

    private final MarketNewsService marketNewsService;

    @GetMapping
    public ResponseEntity<MarketNewsDto.NewsResponse> getNews(
            @RequestParam(defaultValue = "005930") String ticker,
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(marketNewsService.getNewsForTicker(ticker, name));
    }
}
