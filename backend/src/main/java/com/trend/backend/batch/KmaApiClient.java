package com.trend.backend.batch;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class KmaApiClient {

    @Value("${public-data.service-key:dummy_service_key}")
    private String serviceKey;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class DailyWeather {
        public String date;       // yyyy-MM-dd
        public double avgTemp;
        public double minTemp;
        public double maxTemp;
        public double rainfall;

        public DailyWeather(String date, double avgTemp, double minTemp, double maxTemp, double rainfall) {
            this.date = date;
            this.avgTemp = avgTemp;
            this.minTemp = minTemp;
            this.maxTemp = maxTemp;
            this.rainfall = rainfall;
        }
    }

    public static class MonthlyWeather {
        public String yearMonth;     // yyyy-MM
        public double avgTemp;
        public double minTemp;
        public double maxTemp;
        public double totalRainfall;
        public int hotDaysCount;     // 최고기온 33도 이상 폭염일수
        public int rainyDaysCount;   // 강수일수
        public double deliveryIndex; // 배달 소비지수 (폭염/한파/우천 연동)
        public double fnbIndex;      // 음료/빙과류 소비지수 (고온 연동)
        public double fashionIndex;  // 패션 소비지수 (환절기/기온변화 연동)

        public MonthlyWeather(String yearMonth, double avgTemp, double minTemp, double maxTemp, double totalRainfall,
                              int hotDaysCount, int rainyDaysCount, double deliveryIndex, double fnbIndex, double fashionIndex) {
            this.yearMonth = yearMonth;
            this.avgTemp = avgTemp;
            this.minTemp = minTemp;
            this.maxTemp = maxTemp;
            this.totalRainfall = totalRainfall;
            this.hotDaysCount = hotDaysCount;
            this.rainyDaysCount = rainyDaysCount;
            this.deliveryIndex = deliveryIndex;
            this.fnbIndex = fnbIndex;
            this.fashionIndex = fashionIndex;
        }
    }

    /**
     * 기상청 ASOS 서울 지점(108) 최근 12개월분 일별 관측 데이터 조회 및 월별 집계
     */
    public List<MonthlyWeather> fetchMonthlyWeatherSeries() {
        try {
            LocalDate now = LocalDate.now();
            // 12개월 전 1일 ~ 현재
            LocalDate start = now.minusMonths(11).withDayOfMonth(1);
            String startDt = start.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String endDt = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            List<DailyWeather> dailyList = fetchDailyWeather(startDt, endDt);
            if (dailyList.isEmpty()) {
                // Try 2023-2024 recent full year
                dailyList = fetchDailyWeather("20230801", "20240831");
            }
            if (dailyList.isEmpty()) {
                log.warn("No KMA daily data retrieved, using standard climate model fallback.");
                return getFallbackMonthlySeries();
            }

            // Group by year-month
            Map<String, List<DailyWeather>> byMonth = new TreeMap<>();
            for (DailyWeather d : dailyList) {
                String ym = d.date.substring(0, 7);
                byMonth.computeIfAbsent(ym, k -> new ArrayList<>()).add(d);
            }

            List<MonthlyWeather> monthlyResult = new ArrayList<>();
            for (Map.Entry<String, List<DailyWeather>> entry : byMonth.entrySet()) {
                String ym = entry.getKey();
                List<DailyWeather> list = entry.getValue();

                double sumAvgT = 0;
                double minT = Double.MAX_VALUE;
                double maxT = -Double.MAX_VALUE;
                double sumRain = 0;
                int hotDays = 0;
                int rainyDays = 0;

                for (DailyWeather dw : list) {
                    sumAvgT += dw.avgTemp;
                    if (dw.minTemp < minT) minT = dw.minTemp;
                    if (dw.maxTemp > maxT) maxT = dw.maxTemp;
                    sumRain += dw.rainfall;
                    if (dw.maxTemp >= 33.0) hotDays++;
                    if (dw.rainfall >= 1.0) rainyDays++;
                }

                double monthAvgT = Math.round((sumAvgT / list.size()) * 10.0) / 10.0;
                double monthTotalRain = Math.round(sumRain * 10.0) / 10.0;

                // 기온 및 강수량 기반 경제 소비 지표 산출 모델 (Base 100)
                // 1. 배달외식: 혹서기(>28도)나 한파(<0도) 및 비오는 날 급증
                double deliveryIdx = 100.0;
                if (monthAvgT > 25.0) deliveryIdx += (monthAvgT - 25.0) * 3.5 + (hotDays * 1.8);
                else if (monthAvgT < 3.0) deliveryIdx += (3.0 - monthAvgT) * 3.2;
                deliveryIdx += (rainyDays * 1.2);
                deliveryIdx = Math.round(deliveryIdx * 10.0) / 10.0;

                // 2. 음료/빙과류(F&B): 여름철 고온일수록 정비례 폭증
                double fnbIdx = 70.0;
                if (monthAvgT > 10.0) fnbIdx += (monthAvgT - 10.0) * 4.8 + (hotDays * 2.5);
                else fnbIdx = Math.max(65.0, 70.0 - (10.0 - monthAvgT) * 1.5);
                fnbIdx = Math.round(fnbIdx * 10.0) / 10.0;

                // 3. 패션/의류: 환절기(봄 3~5월, 가을 9~11월) 및 겨울 방한복 시즌 급증
                double fashionIdx = 95.0;
                int monthNum = Integer.parseInt(ym.substring(5, 7));
                if (monthNum >= 3 && monthNum <= 5) fashionIdx = 125.0 + (monthNum - 3) * 6.0;
                else if (monthNum >= 9 && monthNum <= 11) fashionIdx = 135.0 + (11 - monthNum) * 5.0;
                else if (monthNum == 12 || monthNum <= 2) fashionIdx = 110.0 + (monthAvgT < 0 ? 15.0 : 5.0);
                else fashionIdx = 90.0 + (hotDays * 1.0);
                fashionIdx = Math.round(fashionIdx * 10.0) / 10.0;

                monthlyResult.add(new MonthlyWeather(
                        ym,
                        monthAvgT,
                        minT == Double.MAX_VALUE ? 0.0 : Math.round(minT * 10.0) / 10.0,
                        maxT == -Double.MAX_VALUE ? 0.0 : Math.round(maxT * 10.0) / 10.0,
                        monthTotalRain,
                        hotDays,
                        rainyDays,
                        deliveryIdx,
                        fnbIdx,
                        fashionIdx
                ));
            }

            log.info("Successfully fetched and aggregated {} months of real KMA weather data.", monthlyResult.size());
            return monthlyResult;

        } catch (Exception e) {
            log.error("Failed to fetch KMA weather series: {}", e.getMessage(), e);
            return getFallbackMonthlySeries();
        }
    }

    private List<DailyWeather> fetchDailyWeather(String startDt, String endDt) {
        List<DailyWeather> results = new ArrayList<>();
        try {
            String decodedKey = getDecodedKey();
            String encodedKey = URLEncoder.encode(decodedKey, StandardCharsets.UTF_8);

            String urlStr = "http://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList"
                    + "?serviceKey=" + encodedKey
                    + "&numOfRows=999&pageNo=1&dataType=JSON&dataCd=ASOS&dateCd=DAY"
                    + "&startDt=" + startDt + "&endDt=" + endDt + "&stnIds=108";

            String jsonResp = restClient.get()
                    .uri(URI.create(urlStr))
                    .retrieve()
                    .body(String.class);

            if (jsonResp == null || jsonResp.isBlank()) return results;

            JsonNode root = objectMapper.readTree(jsonResp);
            JsonNode itemNode = root.path("response").path("body").path("items").path("item");

            if (itemNode.isArray()) {
                for (JsonNode node : itemNode) {
                    String tm = node.path("tm").asText();
                    double avgTa = parseDouble(node.path("avgTa").asText(), 20.0);
                    double minTa = parseDouble(node.path("minTa").asText(), avgTa - 4.0);
                    double maxTa = parseDouble(node.path("maxTa").asText(), avgTa + 4.0);
                    double sumRn = parseDouble(node.path("sumRn").asText(), 0.0);

                    results.add(new DailyWeather(tm, avgTa, minTa, maxTa, sumRn));
                }
            }
        } catch (Exception e) {
            log.warn("KMA daily weather fetch failed: {}", e.getMessage());
        }
        return results;
    }

    private String getDecodedKey() {
        if (serviceKey == null || serviceKey.isBlank()) return "";
        try {
            return URLDecoder.decode(serviceKey, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return serviceKey;
        }
    }

    private double parseDouble(String str, double defaultVal) {
        if (str == null || str.isBlank()) return defaultVal;
        try {
            return Double.parseDouble(str.trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private List<MonthlyWeather> getFallbackMonthlySeries() {
        List<MonthlyWeather> fallback = new ArrayList<>();
        String[] dates = {"2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08"};
        double[] temp = {23.5, 16.2, 8.8, -0.5, -2.8, 1.8, 9.2, 15.1, 21.0, 26.2, 29.5, 30.2};
        double[] rain = {120.0, 45.0, 32.0, 18.0, 12.0, 22.0, 40.0, 68.0, 95.0, 180.0, 360.0, 240.0};
        double[] delivery = {105.0, 98.0, 106.0, 124.0, 130.0, 116.0, 101.0, 95.0, 97.0, 114.0, 134.0, 128.5};
        double[] fnb = {120.0, 98.0, 84.0, 72.0, 68.0, 76.0, 94.0, 110.0, 128.0, 148.0, 172.0, 168.0};
        double[] fashion = {100.0, 128.0, 140.0, 145.0, 112.0, 98.0, 122.0, 135.0, 118.0, 108.0, 94.0, 98.0};

        for (int i = 0; i < dates.length; i++) {
            fallback.add(new MonthlyWeather(
                    dates[i], temp[i], temp[i] - 5.0, temp[i] + 5.0, rain[i],
                    temp[i] > 28 ? 12 : 0, rain[i] > 100 ? 14 : 5,
                    delivery[i], fnb[i], fashion[i]
            ));
        }
        return fallback;
    }
}
