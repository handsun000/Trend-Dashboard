package com.trend.backend.batch;

import com.trend.backend.domain.StockHistory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.annotation.BeforeStep;
import org.springframework.batch.item.ItemReader;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MarketDataItemReader implements ItemReader<StockHistory> {

    private final UpbitApiClient upbitApiClient;
    private final KisApiClient kisApiClient;
    private Iterator<StockHistory> iterator;

    @BeforeStep
    public void initData() {
        List<StockHistory> dataList = new ArrayList<>();

        // 1. Upbit Open API Real-time Tickers (BTC, ETH, XRP, SOL)
        List<UpbitTickerDto> upbitData = upbitApiClient.fetchRealtimeTickers("KRW-BTC,KRW-ETH,KRW-XRP,KRW-SOL");
        for (UpbitTickerDto dto : upbitData) {
            StockHistory history = new StockHistory();
            history.setTicker(dto.getMarket());
            history.setCurrentPrice(dto.getTradePrice());
            history.setVolume(dto.getAccTradeVolume24h() != null ? dto.getAccTradeVolume24h().longValue() : 1000L);
            history.setTimestamp(LocalDateTime.now());
            dataList.add(history);
        }

        // 2. Korea Investment (KIS) Open API Stock Data (Samsung Electronics, SK Hynix)
        Double samsungPrice = kisApiClient.fetchStockPrice("005930");
        Double hynixPrice = kisApiClient.fetchStockPrice("000660");

        dataList.add(createHistory("005930", samsungPrice));
        dataList.add(createHistory("000660", hynixPrice));

        this.iterator = dataList.iterator();
        log.info("MarketDataItemReader initialized with {} items (Upbit + KIS)", dataList.size());
    }

    private StockHistory createHistory(String ticker, Double price) {
        StockHistory history = new StockHistory();
        history.setTicker(ticker);
        history.setCurrentPrice(price);
        history.setVolume(50000L);
        history.setTimestamp(LocalDateTime.now());
        return history;
    }

    @Override
    public StockHistory read() throws Exception {
        if (this.iterator == null) {
            initData();
        }
        if (iterator != null && iterator.hasNext()) {
            return iterator.next();
        }
        this.iterator = null;
        return null;
    }
}
