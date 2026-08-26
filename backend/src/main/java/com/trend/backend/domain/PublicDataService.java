package com.trend.backend.domain;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicDataService {

    private final PublicDataRepository publicDataRepository;

    @PostConstruct
    @Transactional
    public void initSeedData() {
        if (publicDataRepository.count() > 0) {
            log.info("PublicData repository already seeded with {} records.", publicDataRepository.count());
            return;
        }

        log.info("Initializing comprehensive public trend datasets (Real Estate, Macroeconomics, Weather/Consumption)...");
        List<PublicData> list = new ArrayList<>();

        // 1. REAL ESTATE SEED (12 Months: 2025.09 ~ 2026.08)
        String[] months = {"2025-09-01", "2025-10-01", "2025-11-01", "2025-12-01", "2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01"};
        
        // Seoul Apartment Price Index (base 100)
        double[] seoulIndex = {101.2, 101.6, 102.1, 102.3, 102.7, 103.1, 103.5, 103.9, 104.2, 104.5, 104.8, 105.1};
        // Gyeonggi/Incheon Index
        double[] capitalIndex = {99.8, 100.1, 100.3, 100.4, 100.7, 101.0, 101.2, 101.5, 101.8, 102.1, 102.3, 102.6};
        // Nationwide Index
        double[] nationIndex = {98.5, 98.6, 98.7, 98.8, 98.9, 99.1, 99.2, 99.4, 99.5, 99.7, 99.8, 100.0};
        // Seoul Trading Volume (Monthly건)
        double[] seoulVolume = {3850, 4120, 3950, 3600, 3200, 3800, 4600, 5300, 5800, 6200, 6500, 6850};

        for (int i = 0; i < months.length; i++) {
            LocalDate refDate = LocalDate.parse(months[i]);
            list.add(PublicData.builder().category("REAL_ESTATE").subCategory("SEOUL").title("서울 아파트 매매가격지수").value(seoulIndex[i]).unit("pt").referenceDate(refDate).build());
            list.add(PublicData.builder().category("REAL_ESTATE").subCategory("CAPITAL").title("수도권 아파트 매매가격지수").value(capitalIndex[i]).unit("pt").referenceDate(refDate).build());
            list.add(PublicData.builder().category("REAL_ESTATE").subCategory("NATION").title("전국 아파트 매매가격지수").value(nationIndex[i]).unit("pt").referenceDate(refDate).build());
            list.add(PublicData.builder().category("REAL_ESTATE").subCategory("VOLUME").title("서울 아파트 월간 거래량").value(seoulVolume[i]).unit("건").referenceDate(refDate).build());
        }

        // 2. MACRO ECONOMICS SEED (12 Months)
        double[] bokRates = {3.50, 3.50, 3.25, 3.25, 3.25, 3.25, 3.00, 3.00, 3.00, 2.75, 2.75, 2.75};
        double[] fedRates = {5.50, 5.25, 5.00, 5.00, 4.75, 4.75, 4.50, 4.50, 4.25, 4.25, 4.00, 4.00};
        double[] cpis = {2.6, 2.5, 2.3, 2.2, 2.4, 2.3, 2.2, 2.1, 2.0, 2.2, 2.1, 2.0};
        double[] ppis = {1.8, 1.6, 1.4, 1.2, 1.5, 1.4, 1.3, 1.1, 1.0, 1.2, 1.1, 0.9};
        double[] exchange = {1340.5, 1360.0, 1380.2, 1395.0, 1410.0, 1425.5, 1390.0, 1375.0, 1365.2, 1370.0, 1382.4, 1385.5};

        for (int i = 0; i < months.length; i++) {
            LocalDate refDate = LocalDate.parse(months[i]);
            list.add(PublicData.builder().category("MACRO").subCategory("BOK_RATE").title("한국은행 기준금리").value(bokRates[i]).unit("%").referenceDate(refDate).build());
            list.add(PublicData.builder().category("MACRO").subCategory("FED_RATE").title("미국 연준 기준금리").value(fedRates[i]).unit("%").referenceDate(refDate).build());
            list.add(PublicData.builder().category("MACRO").subCategory("CPI").title("소비자물가지수(CPI) 상승률").value(cpis[i]).unit("%").referenceDate(refDate).build());
            list.add(PublicData.builder().category("MACRO").subCategory("PPI").title("생산자물가지수(PPI) 상승률").value(ppis[i]).unit("%").referenceDate(refDate).build());
            list.add(PublicData.builder().category("MACRO").subCategory("EXCHANGE_USD").title("원/달러 환율").value(exchange[i]).unit("원").referenceDate(refDate).build());
        }

        // 3. WEATHER & CONSUMPTION CORRELATION SEED (12 Months)
        double[] temperatures = {22.5, 15.2, 7.8, -1.2, -3.5, 1.2, 8.5, 14.2, 20.1, 25.4, 28.9, 29.5};
        double[] rainfalls = {145.0, 52.0, 38.0, 22.0, 15.0, 28.0, 45.0, 78.0, 110.0, 195.0, 380.0, 260.0};
        double[] deliveryIndex = {102.5, 98.0, 105.2, 122.4, 128.5, 115.0, 100.2, 94.5, 96.0, 112.5, 132.0, 126.8};
        double[] fnbBeverageIndex = {115.0, 95.2, 82.0, 74.0, 70.5, 78.0, 92.0, 108.5, 124.0, 142.5, 168.0, 165.2};
        double[] fashionIndex = {98.0, 125.0, 138.0, 142.0, 110.0, 95.0, 120.0, 132.0, 115.0, 105.0, 92.0, 96.5};

        for (int i = 0; i < months.length; i++) {
            LocalDate refDate = LocalDate.parse(months[i]);
            list.add(PublicData.builder().category("WEATHER_CONSUMPTION").subCategory("TEMP").title("월평균 기온").value(temperatures[i]).unit("℃").referenceDate(refDate).build());
            list.add(PublicData.builder().category("WEATHER_CONSUMPTION").subCategory("RAIN").title("월 강수량").value(rainfalls[i]).unit("mm").referenceDate(refDate).build());
            list.add(PublicData.builder().category("WEATHER_CONSUMPTION").subCategory("DELIVERY").title("배달외식 소비지수").value(deliveryIndex[i]).unit("pt").referenceDate(refDate).build());
            list.add(PublicData.builder().category("WEATHER_CONSUMPTION").subCategory("FNB").title("음료/빙과류 소비지수").value(fnbBeverageIndex[i]).unit("pt").referenceDate(refDate).build());
            list.add(PublicData.builder().category("WEATHER_CONSUMPTION").subCategory("FASHION").title("패션/의류 소비지수").value(fashionIndex[i]).unit("pt").referenceDate(refDate).build());
        }

        publicDataRepository.saveAll(list);
        log.info("Successfully seeded {} public trend indicators into PostgreSQL/H2.", list.size());
    }

    public PublicDataDto.SummaryResponse getSummary() {
        return PublicDataDto.SummaryResponse.builder()
                .bokRate(2.75)
                .fedRate(4.00)
                .cpi(2.0)
                .ppi(0.9)
                .exchangeRate(1385.5)
                .seoulApartmentIndex(105.1)
                .seoulApartmentChange(0.29)
                .avgTemperature(29.5)
                .deliveryDemandIndex(126.8)
                .macroInsight("한-미 기준금리 격차가 1.25%p로 축소되었으며, 인플레이션이 2.0% 목표치에 안착하며 금융 안정성이 제고되고 있습니다.")
                .realEstateInsight("서울 핵심 상급지(강남 3구, 마용성) 위주로 신고가 거래가 이어지며 월간 아파트 거래량이 연중 최고치(6,850건)를 갱신 중입니다.")
                .weatherInsight("폭염 및 열대야 지속으로 음료/빙과류 및 실내 배달외식 소비지수가 전년 동기 대비 +18.5% 급증세를 보이고 있습니다.")
                .build();
    }

    public List<Map<String, Object>> getRealEstateSeries() {
        List<Map<String, Object>> series = new ArrayList<>();
        String[] dates = {"2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"};
        double[] seoul = {101.2, 101.6, 102.1, 102.3, 102.7, 103.1, 103.5, 103.9, 104.2, 104.5, 104.8, 105.1};
        double[] capital = {99.8, 100.1, 100.3, 100.4, 100.7, 101.0, 101.2, 101.5, 101.8, 102.1, 102.3, 102.6};
        double[] nation = {98.5, 98.6, 98.7, 98.8, 98.9, 99.1, 99.2, 99.4, 99.5, 99.7, 99.8, 100.0};
        double[] vol = {3850, 4120, 3950, 3600, 3200, 3800, 4600, 5300, 5800, 6200, 6500, 6850};

        for (int i = 0; i < dates.length; i++) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", dates[i]);
            point.put("seoul", seoul[i]);
            point.put("capital", capital[i]);
            point.put("nationwide", nation[i]);
            point.put("volume", vol[i]);
            series.add(point);
        }
        return series;
    }

    public List<Map<String, Object>> getMacroSeries() {
        List<Map<String, Object>> series = new ArrayList<>();
        String[] dates = {"2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"};
        double[] bok = {3.50, 3.50, 3.25, 3.25, 3.25, 3.25, 3.00, 3.00, 3.00, 2.75, 2.75, 2.75};
        double[] fed = {5.50, 5.25, 5.00, 5.00, 4.75, 4.75, 4.50, 4.50, 4.25, 4.25, 4.00, 4.00};
        double[] cpi = {2.6, 2.5, 2.3, 2.2, 2.4, 2.3, 2.2, 2.1, 2.0, 2.2, 2.1, 2.0};
        double[] ppi = {1.8, 1.6, 1.4, 1.2, 1.5, 1.4, 1.3, 1.1, 1.0, 1.2, 1.1, 0.9};
        double[] ex = {1340.5, 1360.0, 1380.2, 1395.0, 1410.0, 1425.5, 1390.0, 1375.0, 1365.2, 1370.0, 1382.4, 1385.5};

        for (int i = 0; i < dates.length; i++) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", dates[i]);
            point.put("bokRate", bok[i]);
            point.put("fedRate", fed[i]);
            point.put("cpi", cpi[i]);
            point.put("ppi", ppi[i]);
            point.put("exchangeRate", ex[i]);
            series.add(point);
        }
        return series;
    }

    public List<Map<String, Object>> getWeatherConsumptionSeries() {
        List<Map<String, Object>> series = new ArrayList<>();
        String[] dates = {"2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"};
        double[] temp = {22.5, 15.2, 7.8, -1.2, -3.5, 1.2, 8.5, 14.2, 20.1, 25.4, 28.9, 29.5};
        double[] rain = {145.0, 52.0, 38.0, 22.0, 15.0, 28.0, 45.0, 78.0, 110.0, 195.0, 380.0, 260.0};
        double[] delivery = {102.5, 98.0, 105.2, 122.4, 128.5, 115.0, 100.2, 94.5, 96.0, 112.5, 132.0, 126.8};
        double[] fnb = {115.0, 95.2, 82.0, 74.0, 70.5, 78.0, 92.0, 108.5, 124.0, 142.5, 168.0, 165.2};
        double[] fashion = {98.0, 125.0, 138.0, 142.0, 110.0, 95.0, 120.0, 132.0, 115.0, 105.0, 92.0, 96.5};

        for (int i = 0; i < dates.length; i++) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", dates[i]);
            point.put("temperature", temp[i]);
            point.put("rainfall", rain[i]);
            point.put("deliveryIndex", delivery[i]);
            point.put("fnbIndex", fnb[i]);
            point.put("fashionIndex", fashion[i]);
            series.add(point);
        }
        return series;
    }

    public List<PublicDataDto.RealEstateTransaction> getRecentTransactions() {
        return List.of(
                PublicDataDto.RealEstateTransaction.builder()
                        .complexName("압구정 현대 1·2차")
                        .region("서울 강남구 압구정동")
                        .area("160㎡ (53평형)")
                        .recentPrice(65.0)
                        .prevPrice(62.5)
                        .changeFormatted("+2.5억")
                        .changeRate(4.0)
                        .tradeDate("2026.08.21")
                        .status("신고가 🚀")
                        .build(),
                PublicDataDto.RealEstateTransaction.builder()
                        .complexName("래미안 원베일리")
                        .region("서울 서초구 반포동")
                        .area("84㎡ (34평형)")
                        .recentPrice(48.5)
                        .prevPrice(46.8)
                        .changeFormatted("+1.7억")
                        .changeRate(3.6)
                        .tradeDate("2026.08.19")
                        .status("신고가 🚀")
                        .build(),
                PublicDataDto.RealEstateTransaction.builder()
                        .complexName("마포 래미안 푸르지오")
                        .region("서울 마포구 아현동")
                        .area("84㎡ (34평형)")
                        .recentPrice(19.2)
                        .prevPrice(18.9)
                        .changeFormatted("+0.3억")
                        .changeRate(1.6)
                        .tradeDate("2026.08.18")
                        .status("상승 📈")
                        .build(),
                PublicDataDto.RealEstateTransaction.builder()
                        .complexName("송도 더샵 퍼스트월드")
                        .region("인천 연수구 송도동")
                        .area("114㎡ (45평형)")
                        .recentPrice(11.5)
                        .prevPrice(11.4)
                        .changeFormatted("+0.1억")
                        .changeRate(0.9)
                        .tradeDate("2026.08.16")
                        .status("보합 ⚖️")
                        .build(),
                PublicDataDto.RealEstateTransaction.builder()
                        .complexName("판교 푸르지오 그랑블")
                        .region("경기 성남 분당구 백현동")
                        .area("105㎡ (40평형)")
                        .recentPrice(27.8)
                        .prevPrice(26.9)
                        .changeFormatted("+0.9억")
                        .changeRate(3.3)
                        .tradeDate("2026.08.14")
                        .status("상승 📈")
                        .build()
        );
    }
}
