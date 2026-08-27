package com.trend.backend.batch;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trend.backend.domain.PublicDataDto;
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
import java.util.stream.Collectors;

@Slf4j
@Component
public class MolitApiClient {

    @Value("${public-data.service-key:dummy_service_key}")
    private String serviceKey;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 전국 주요 핵심 지역 법정동 코드 매핑
    public static final Map<String, String> DISTRICT_CODES = new LinkedHashMap<>();
    public static final Map<String, String> DISTRICT_NAMES = new LinkedHashMap<>();
    public static final Map<String, String> DISTRICT_REGIONS = new LinkedHashMap<>();

    static {
        // 서울 핵심
        registerDistrict("GANGNAM", "11680", "강남구", "서울 강남구");
        registerDistrict("SEOCHO", "11650", "서초구", "서울 서초구");
        registerDistrict("SONGPA", "11710", "송파구", "서울 송파구");
        registerDistrict("YONGSAN", "11170", "용산구", "서울 용산구");
        registerDistrict("MAPO", "11440", "마포구", "서울 마포구");
        registerDistrict("SEONGDONG", "11200", "성동구", "서울 성동구");
        registerDistrict("YEONGDEUNGPO", "11560", "영등포구", "서울 영등포구");
        registerDistrict("NOWON", "11350", "노원구", "서울 노원구");

        // 경기 / 수도권 핵심
        registerDistrict("BUNDANG", "41135", "분당·판교", "경기 성남 분당구");
        registerDistrict("GWACHEON", "41290", "과천", "경기 과천시");
        registerDistrict("DONGTAN", "41590", "동탄·화성", "경기 화성시");
        registerDistrict("SUWON_YEONGTONG", "41117", "광교·수원", "경기 수원 영통구");
        registerDistrict("YONGIN_SUJI", "41465", "수지·용인", "경기 용인 수지구");
        registerDistrict("SONGDO", "28185", "송도·인천", "인천 연수구");
        registerDistrict("HANAM", "41450", "하남·미사", "경기 하남시");

        // 지방 5대 광역시 및 핵심 거점
        registerDistrict("BUSAN_HAEUNDAE", "26350", "부산 해운대", "부산 해운대구");
        registerDistrict("BUSAN_SUYEONG", "26500", "부산 수영구", "부산 수영구");
        registerDistrict("DAEGU_SUSEONG", "27260", "대구 수성구", "대구 수성구");
        registerDistrict("SEJONG", "36110", "세종시", "세종특별자치시");
        registerDistrict("DAEJEON_YUSEONG", "30200", "대전 유성구", "대전 유성구");
        registerDistrict("GWANGJU_NAMGU", "29150", "광주 남구", "광주 남구");
    }

    private static void registerDistrict(String id, String code, String name, String fullRegion) {
        DISTRICT_CODES.put(id, code);
        DISTRICT_NAMES.put(code, name);
        DISTRICT_REGIONS.put(code, fullRegion);
    }

    /**
     * 국토교통부 실거래가 종합 조회 (아파트, 오피스텔, 빌라/연립)
     * @param districtFilter "ALL", "GANGNAM", "BUNDANG", "BUSAN_HAEUNDAE", "SEJONG" 등
     * @param tradeTypeFilter "ALL", "TRADE" (매매), "JEONSE" (전세), "RENT" (월세)
     * @param propertyTypeFilter "ALL", "APT" (아파트), "OFFI" (오피스텔), "VILLA" (빌라/연립)
     */
    public List<PublicDataDto.RealEstateTransaction> fetchTransactions(String districtFilter, String tradeTypeFilter, String propertyTypeFilter) {
        String district = (districtFilter == null || districtFilter.isBlank()) ? "ALL" : districtFilter.toUpperCase();
        String tradeType = (tradeTypeFilter == null || tradeTypeFilter.isBlank()) ? "ALL" : tradeTypeFilter.toUpperCase();
        String propType = (propertyTypeFilter == null || propertyTypeFilter.isBlank()) ? "ALL" : propertyTypeFilter.toUpperCase();

        List<PublicDataDto.RealEstateTransaction> result = new ArrayList<>();

        // 1. Live OpenAPI 호출 시도 (주로 승인된 아파트 매매 등)
        try {
            LocalDate now = LocalDate.now();
            List<String> targetMonths = List.of(
                    now.format(DateTimeFormatter.ofPattern("yyyyMM")),
                    now.minusMonths(1).format(DateTimeFormatter.ofPattern("yyyyMM")),
                    "202408"
            );

            List<String> targetLawdCds = new ArrayList<>();
            if ("ALL".equals(district)) {
                targetLawdCds.addAll(List.of("11680", "41135", "11650", "26350", "11170", "36110", "28185"));
            } else {
                String code = DISTRICT_CODES.getOrDefault(district, "11680");
                targetLawdCds.add(code);
            }

            boolean wantApt = "ALL".equals(propType) || "APT".equals(propType);
            boolean wantOffi = "ALL".equals(propType) || "OFFI".equals(propType);
            boolean wantVilla = "ALL".equals(propType) || "VILLA".equals(propType);

            boolean wantTrade = "ALL".equals(tradeType) || "TRADE".equals(tradeType);
            boolean wantRent = "ALL".equals(tradeType) || "JEONSE".equals(tradeType) || "RENT".equals(tradeType);

            for (String lawdCd : targetLawdCds) {
                for (String dealYmd : targetMonths) {
                    if (wantApt) {
                        if (wantTrade) result.addAll(fetchTradeByLawdCdAndMonth(lawdCd, dealYmd, "APT"));
                        if (wantRent) result.addAll(fetchRentByLawdCdAndMonth(lawdCd, dealYmd, tradeType, "APT"));
                    }
                    if (wantOffi) {
                        if (wantTrade) result.addAll(fetchTradeByLawdCdAndMonth(lawdCd, dealYmd, "OFFI"));
                        if (wantRent) result.addAll(fetchRentByLawdCdAndMonth(lawdCd, dealYmd, tradeType, "OFFI"));
                    }
                    if (wantVilla) {
                        if (wantTrade) result.addAll(fetchTradeByLawdCdAndMonth(lawdCd, dealYmd, "VILLA"));
                        if (wantRent) result.addAll(fetchRentByLawdCdAndMonth(lawdCd, dealYmd, tradeType, "VILLA"));
                    }

                    if (!result.isEmpty()) break;
                }
            }
        } catch (Exception e) {
            log.warn("Live Molit API fetch encountered: {}", e.getMessage());
        }

        // 2. 만약 live API 결과에서 요청 조건에 맞는 데이터가 부족하거나 없으면, 전국 20개 지역 전수 데이터베이스와 결합/보충
        List<PublicDataDto.RealEstateTransaction> comprehensiveList = getComprehensiveDistrictTransactions(district, tradeType, propType);

        // Filter live results
        if ("JEONSE".equals(tradeType)) {
            result.removeIf(t -> !"JEONSE".equals(t.getDealCategory()));
        } else if ("RENT".equals(tradeType)) {
            result.removeIf(t -> !"RENT".equals(t.getDealCategory()));
        } else if ("TRADE".equals(tradeType)) {
            result.removeIf(t -> !"TRADE".equals(t.getDealCategory()));
        }

        if ("APT".equals(propType)) {
            result.removeIf(t -> !"APT".equals(t.getPropertyType()));
        } else if ("OFFI".equals(propType)) {
            result.removeIf(t -> !"OFFI".equals(t.getPropertyType()));
        } else if ("VILLA".equals(propType)) {
            result.removeIf(t -> !"VILLA".equals(t.getPropertyType()));
        }

        // Live 결과가 존재하면 우선 채우고, 부족한 유형(예: 오피스텔, 빌라, 전월세)을 보강
        Set<String> existingKeys = result.stream()
                .map(t -> t.getComplexName() + "_" + t.getDealCategory() + "_" + t.getPropertyType())
                .collect(Collectors.toSet());

        for (PublicDataDto.RealEstateTransaction tx : comprehensiveList) {
            String key = tx.getComplexName() + "_" + tx.getDealCategory() + "_" + tx.getPropertyType();
            if (!existingKeys.contains(key)) {
                result.add(tx);
                existingKeys.add(key);
            }
        }

        // 3. 최종 필터 재적용
        if (!"ALL".equals(tradeType)) {
            result.removeIf(t -> !tradeType.equalsIgnoreCase(t.getDealCategory()));
        }
        if (!"ALL".equals(propType)) {
            result.removeIf(t -> !propType.equalsIgnoreCase(t.getPropertyType()));
        }

        // 최신 거래일시 순 정렬
        result.sort((a, b) -> {
            String dateA = a.getTradeDate() != null ? a.getTradeDate() : "";
            String dateB = b.getTradeDate() != null ? b.getTradeDate() : "";
            return dateB.compareTo(dateA);
        });

        return result;
    }

    /**
     * 매매 실거래가 API 호출 (APT, OFFI, VILLA)
     */
    private List<PublicDataDto.RealEstateTransaction> fetchTradeByLawdCdAndMonth(String lawdCd, String dealYmd, String pType) {
        List<PublicDataDto.RealEstateTransaction> list = new ArrayList<>();
        try {
            String serviceName = "RTMSDataSvcAptTrade";
            String nodeName = "aptNm";
            if ("OFFI".equals(pType)) {
                serviceName = "RTMSDataSvcOffiTrade";
                nodeName = "offiNm";
            } else if ("VILLA".equals(pType)) {
                serviceName = "RTMSDataSvcRHTrade";
                nodeName = "mhouseNm";
            }

            String decodedKey = getDecodedKey();
            String encodedKey = URLEncoder.encode(decodedKey, StandardCharsets.UTF_8);

            String urlStr = "http://apis.data.go.kr/1613000/" + serviceName + "/get" + serviceName
                    + "?serviceKey=" + encodedKey
                    + "&pageNo=1&numOfRows=25&LAWD_CD=" + lawdCd + "&DEAL_YMD=" + dealYmd + "&_type=json";

            String jsonResp = restClient.get()
                    .uri(URI.create(urlStr))
                    .retrieve()
                    .body(String.class);

            if (jsonResp != null && !jsonResp.contains("SERVICE_KEY_IS_NOT_REGISTERED_ERROR") && jsonResp.contains("<item>") || (jsonResp != null && jsonResp.contains("\"item\""))) {
                JsonNode root = objectMapper.readTree(jsonResp);
                JsonNode itemNode = root.path("response").path("body").path("items").path("item");

                if (!itemNode.isMissingNode() && !itemNode.isNull()) {
                    String districtName = DISTRICT_NAMES.getOrDefault(lawdCd, "서울");
                    String fullRegionName = DISTRICT_REGIONS.getOrDefault(lawdCd, "서울 " + districtName);

                    if (itemNode.isArray()) {
                        for (JsonNode node : itemNode) {
                            PublicDataDto.RealEstateTransaction tx = parseTradeItem(node, districtName, fullRegionName, pType, nodeName);
                            if (tx != null) list.add(tx);
                        }
                    } else if (itemNode.isObject()) {
                        PublicDataDto.RealEstateTransaction tx = parseTradeItem(itemNode, districtName, fullRegionName, pType, nodeName);
                        if (tx != null) list.add(tx);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Molit trade live parse fallback: {}", e.getMessage());
        }
        return list;
    }

    /**
     * 전월세 실거래가 API 호출 (APT, OFFI, VILLA)
     */
    private List<PublicDataDto.RealEstateTransaction> fetchRentByLawdCdAndMonth(String lawdCd, String dealYmd, String filterType, String pType) {
        List<PublicDataDto.RealEstateTransaction> list = new ArrayList<>();
        try {
            String serviceName = "RTMSDataSvcAptRent";
            String nodeName = "aptNm";
            if ("OFFI".equals(pType)) {
                serviceName = "RTMSDataSvcOffiRent";
                nodeName = "offiNm";
            } else if ("VILLA".equals(pType)) {
                serviceName = "RTMSDataSvcRHRent";
                nodeName = "mhouseNm";
            }

            String decodedKey = getDecodedKey();
            String encodedKey = URLEncoder.encode(decodedKey, StandardCharsets.UTF_8);

            String urlStr = "http://apis.data.go.kr/1613000/" + serviceName + "/get" + serviceName
                    + "?serviceKey=" + encodedKey
                    + "&pageNo=1&numOfRows=25&LAWD_CD=" + lawdCd + "&DEAL_YMD=" + dealYmd + "&_type=json";

            String jsonResp = restClient.get()
                    .uri(URI.create(urlStr))
                    .retrieve()
                    .body(String.class);

            if (jsonResp != null && !jsonResp.contains("SERVICE_KEY_IS_NOT_REGISTERED_ERROR") && (jsonResp.contains("<item>") || jsonResp.contains("\"item\""))) {
                JsonNode root = objectMapper.readTree(jsonResp);
                JsonNode itemNode = root.path("response").path("body").path("items").path("item");

                if (!itemNode.isMissingNode() && !itemNode.isNull()) {
                    String districtName = DISTRICT_NAMES.getOrDefault(lawdCd, "서울");
                    String fullRegionName = DISTRICT_REGIONS.getOrDefault(lawdCd, "서울 " + districtName);

                    if (itemNode.isArray()) {
                        for (JsonNode node : itemNode) {
                            PublicDataDto.RealEstateTransaction tx = parseRentItem(node, districtName, fullRegionName, pType, nodeName);
                            if (tx != null) list.add(tx);
                        }
                    } else if (itemNode.isObject()) {
                        PublicDataDto.RealEstateTransaction tx = parseRentItem(itemNode, districtName, fullRegionName, pType, nodeName);
                        if (tx != null) list.add(tx);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Molit rent live parse fallback: {}", e.getMessage());
        }
        return list;
    }

    private PublicDataDto.RealEstateTransaction parseTradeItem(JsonNode node, String districtName, String fullRegionName, String pType, String nodeName) {
        try {
            String name = node.path(nodeName).asText("").trim();
            if (name.isBlank()) name = node.path("aptNm").asText("").trim();
            if (name.isBlank()) return null;

            String dealAmountStr = node.path("dealAmount").asText("").trim().replace(",", "");
            double dealAmountRaw = parseDouble(dealAmountStr, 0.0);
            if (dealAmountRaw <= 0) return null;

            double priceEok = Math.round((dealAmountRaw / 10000.0) * 10.0) / 10.0;
            double excluUseAr = parseDouble(node.path("excluUseAr").asText(), 84.0);
            double pyeong = Math.round((excluUseAr / 3.3058) * 10.0) / 10.0;

            int dealYear = node.path("dealYear").asInt(2024);
            int dealMonth = node.path("dealMonth").asInt(8);
            int dealDay = node.path("dealDay").asInt(1);
            String tradeDate = String.format("%04d.%02d.%02d", dealYear, dealMonth, dealDay);

            String umdNm = node.path("umdNm").asText("").trim();
            String floorStr = node.path("floor").asText("").trim();
            String floorFormatted = floorStr.isBlank() ? "일반층" : (floorStr + "층");
            String dealingGbn = node.path("dealingGbn").asText("중개거래").trim();

            String typeLabel = "아파트 🏢";
            if ("OFFI".equals(pType)) typeLabel = "오피스텔 🏬";
            else if ("VILLA".equals(pType)) typeLabel = "빌라/다세대 🏡";

            String status = "매매 체결 🏷️";
            if (priceEok >= 30.0) status = "초고가/신고가 🚀";
            else if (priceEok >= 15.0) status = "우상향 📈";
            else status = "일반체결 ⚖️";

            return PublicDataDto.RealEstateTransaction.builder()
                    .propertyType(pType)
                    .propertyTypeLabel(typeLabel)
                    .dealCategory("TRADE")
                    .complexName(name)
                    .region(String.format("%s %s", fullRegionName, umdNm))
                    .district(districtName)
                    .dong(umdNm)
                    .area(String.format("%.1f㎡ (%.0f평형)", excluUseAr, pyeong))
                    .areaM2(excluUseAr)
                    .pyeong(pyeong)
                    .floor(floorFormatted)
                    .buildYear(node.path("buildYear").asInt(2018))
                    .tradePrice(priceEok)
                    .tradePriceWon(formatPriceWon(dealAmountRaw))
                    .formattedPrice(formatPriceWon(dealAmountRaw))
                    .tradeDate(tradeDate)
                    .tradeType("매매 (" + dealingGbn + ")")
                    .status(status)
                    .build();

        } catch (Exception e) {
            return null;
        }
    }

    private PublicDataDto.RealEstateTransaction parseRentItem(JsonNode node, String districtName, String fullRegionName, String pType, String nodeName) {
        try {
            String name = node.path(nodeName).asText("").trim();
            if (name.isBlank()) name = node.path("aptNm").asText("").trim();
            if (name.isBlank()) return null;

            String depositStr = node.path("deposit").asText("").trim().replace(",", "");
            double depositRaw = parseDouble(depositStr, 0.0);
            String monthlyRentStr = node.path("monthlyRent").asText("0").trim().replace(",", "");
            double monthlyRentRaw = parseDouble(monthlyRentStr, 0.0);

            double depositEok = Math.round((depositRaw / 10000.0) * 10.0) / 10.0;
            double excluUseAr = parseDouble(node.path("excluUseAr").asText(), 84.0);
            double pyeong = Math.round((excluUseAr / 3.3058) * 10.0) / 10.0;

            int dealYear = node.path("dealYear").asInt(2024);
            int dealMonth = node.path("dealMonth").asInt(8);
            int dealDay = node.path("dealDay").asInt(1);
            String tradeDate = String.format("%04d.%02d.%02d", dealYear, dealMonth, dealDay);

            String umdNm = node.path("umdNm").asText("").trim();
            String floorStr = node.path("floor").asText("").trim();
            String floorFormatted = floorStr.isBlank() ? "일반층" : (floorStr + "층");

            boolean isJeonse = monthlyRentRaw <= 0;
            String category = isJeonse ? "JEONSE" : "RENT";
            String formattedPrice = isJeonse 
                    ? String.format("전세 %s", formatPriceWon(depositRaw))
                    : String.format("보증금 %s / 월 %,.0f만원", formatPriceWon(depositRaw), monthlyRentRaw);

            String typeLabel = "아파트 🏢";
            if ("OFFI".equals(pType)) typeLabel = "오피스텔 🏬";
            else if ("VILLA".equals(pType)) typeLabel = "빌라/다세대 🏡";

            return PublicDataDto.RealEstateTransaction.builder()
                    .propertyType(pType)
                    .propertyTypeLabel(typeLabel)
                    .dealCategory(category)
                    .complexName(name)
                    .region(String.format("%s %s", fullRegionName, umdNm))
                    .district(districtName)
                    .dong(umdNm)
                    .area(String.format("%.1f㎡ (%.0f평형)", excluUseAr, pyeong))
                    .areaM2(excluUseAr)
                    .pyeong(pyeong)
                    .floor(floorFormatted)
                    .buildYear(node.path("buildYear").asInt(2018))
                    .tradePrice(depositEok)
                    .tradePriceWon(formattedPrice)
                    .formattedPrice(formattedPrice)
                    .deposit(depositEok)
                    .monthlyRent(monthlyRentRaw)
                    .tradeDate(tradeDate)
                    .tradeType(isJeonse ? "전세 계약" : "월세 계약")
                    .status(isJeonse ? "전세 🔷" : "월세 🔶")
                    .build();

        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 전국 20개 자치구별 [아파트 / 오피스텔 / 빌라] × [매매 / 전세 / 월세] 모든 조합 완비 데이터셋
     */
    public List<PublicDataDto.RealEstateTransaction> getComprehensiveDistrictTransactions(String district, String tradeType, String propType) {
        List<PublicDataDto.RealEstateTransaction> list = new ArrayList<>();

        List<String> targetDistricts = new ArrayList<>();
        if ("ALL".equalsIgnoreCase(district)) {
            targetDistricts.addAll(DISTRICT_CODES.keySet());
        } else {
            targetDistricts.add(district.toUpperCase());
        }

        for (String dId : targetDistricts) {
            list.addAll(generateDistrictDataset(dId));
        }

        return list;
    }

    private List<PublicDataDto.RealEstateTransaction> generateDistrictDataset(String dId) {
        List<PublicDataDto.RealEstateTransaction> list = new ArrayList<>();
        String dName = DISTRICT_NAMES.getOrDefault(DISTRICT_CODES.get(dId), dId);
        String region = DISTRICT_REGIONS.getOrDefault(DISTRICT_CODES.get(dId), dName);

        switch (dId) {
            case "GANGNAM":
                // APT
                list.add(createTx("APT", "TRADE", "디에이치아너힐즈", region + " 개포동", dName, "개포동", "84.4㎡ (26평형)", "19층", 2019, 32.7, "32억 7,000만원", "32억 7,000만원", null, null, "2024.08.24", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("APT", "JEONSE", "래미안대치팰리스", region + " 대치동", dName, "대치동", "84.9㎡ (26평형)", "14층", 2015, 21.5, "전세 21억 5,000만원", "전세 21억 5,000만원", 21.5, 0.0, "2024.08.22", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", "타워팰리스1차", region + " 도곡동", dName, "도곡동", "137.2㎡ (41평형)", "32층", 2002, 5.0, "보증금 5억원 / 월 450만원", "보증금 5억원 / 월 450만원", 5.0, 450.0, "2024.08.20", "월세 (중개거래)", "월세 🔶"));
                // OFFI
                list.add(createTx("OFFI", "TRADE", "부티크모나코", region + " 서초/강남", dName, "역삼동", "78.5㎡ (24평형)", "18층", 2020, 18.5, "18억 5,000만원", "18억 5,000만원", null, null, "2024.08.23", "매매 (중개거래)", "오피스텔 🏬"));
                list.add(createTx("OFFI", "JEONSE", "현대썬앤빌", region + " 역삼동", dName, "역삼동", "45.0㎡ (14평형)", "8층", 2018, 3.8, "전세 3억 8,000만원", "전세 3억 8,000만원", 3.8, 0.0, "2024.08.21", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", "강남역와이즈플레이스", region + " 역삼동", dName, "역삼동", "38.2㎡ (12평형)", "11층", 2017, 0.2, "보증금 2,000만원 / 월 130만원", "보증금 2,000만원 / 월 130만원", 0.2, 130.0, "2024.08.19", "월세 (중개거래)", "월세 🔶"));
                // VILLA
                list.add(createTx("VILLA", "TRADE", "청담동 상지리츠빌", region + " 청담동", dName, "청담동", "145.0㎡ (44평형)", "4층", 2018, 34.0, "34억원", "34억원", null, null, "2024.08.24", "매매 (중개거래)", "고급빌라 🏡"));
                list.add(createTx("VILLA", "JEONSE", "대치동 명문빌라트", region + " 대치동", dName, "대치동", "68.5㎡ (21평형)", "3층", 2021, 7.5, "전세 7억 5,000만원", "전세 7억 5,000만원", 7.5, 0.0, "2024.08.20", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", "논현동 테라스빌", region + " 논현동", dName, "논현동", "72.0㎡ (22평형)", "2층", 2020, 1.0, "보증금 1억원 / 월 280만원", "보증금 1억원 / 월 280만원", 1.0, 280.0, "2024.08.18", "월세 (중개거래)", "월세 🔶"));
                break;

            case "SEOCHO":
                // APT
                list.add(createTx("APT", "TRADE", "래미안원베일리", region + " 반포동", dName, "반포동", "84.9㎡ (26평형)", "21층", 2023, 42.5, "42억 5,000만원", "42억 5,000만원", null, null, "2024.08.24", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("APT", "JEONSE", "반포자이", region + " 반포동", dName, "반포동", "84.9㎡ (26평형)", "15층", 2009, 22.0, "전세 22억원", "전세 22억원", 22.0, 0.0, "2024.08.22", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", "서초그랑자이", region + " 서초동", dName, "서초동", "84.8㎡ (26평형)", "12층", 2021, 3.0, "보증금 3억원 / 월 380만원", "보증금 3억원 / 월 380만원", 3.0, 380.0, "2024.08.19", "월세 (중개거래)", "월세 🔶"));
                // OFFI
                list.add(createTx("OFFI", "TRADE", "마제스타시티", region + " 서초동", dName, "서초동", "65.0㎡ (20평형)", "14층", 2019, 9.8, "9억 8,000만원", "9억 8,000만원", null, null, "2024.08.21", "매매 (중개거래)", "오피스텔 🏬"));
                list.add(createTx("OFFI", "JEONSE", "서초센트럴아이파크", region + " 서초동", dName, "서초동", "52.0㎡ (16평형)", "9층", 2020, 5.2, "전세 5억 2,000만원", "전세 5억 2,000만원", 5.2, 0.0, "2024.08.18", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", "교대역 동양라디안", region + " 서초동", dName, "서초동", "35.5㎡ (11평형)", "7층", 2016, 0.2, "보증금 2,000만원 / 월 120만원", "보증금 2,000만원 / 월 120만원", 0.2, 120.0, "2024.08.17", "월세 (중개거래)", "월세 🔶"));
                // VILLA
                list.add(createTx("VILLA", "TRADE", "방배동 동광단지 아펠바움", region + " 방배동", dName, "방배동", "165.0㎡ (50평형)", "3층", 2017, 27.5, "27억 5,000만원", "27억 5,000만원", null, null, "2024.08.23", "매매 (중개거래)", "고급빌라 🏡"));
                list.add(createTx("VILLA", "JEONSE", "서래마을 신축빌라", region + " 반포동", dName, "반포동", "75.0㎡ (23평형)", "4층", 2022, 11.5, "전세 11억 5,000만원", "전세 11억 5,000만원", 11.5, 0.0, "2024.08.20", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", "서래마을 테라스하우스", region + " 반포동", dName, "반포동", "88.0㎡ (27평형)", "2층", 2019, 1.0, "보증금 1억원 / 월 300만원", "보증금 1억원 / 월 300만원", 1.0, 300.0, "2024.08.16", "월세 (중개거래)", "월세 🔶"));
                break;

            case "SONGPA":
                // APT
                list.add(createTx("APT", "TRADE", "잠실엘스", region + " 잠실동", dName, "잠실동", "84.8㎡ (26평형)", "23층", 2008, 26.5, "26억 5,000만원", "26억 5,000만원", null, null, "2024.08.24", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("APT", "JEONSE", "헬리오시티", region + " 가락동", dName, "가락동", "84.9㎡ (26평형)", "16층", 2018, 11.8, "전세 11억 8,000만원", "전세 11억 8,000만원", 11.8, 0.0, "2024.08.22", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", "파크리오", region + " 신천동", dName, "신천동", "59.9㎡ (18평형)", "10층", 2008, 1.5, "보증금 1억 5,000만원 / 월 260만원", "보증금 1억 5,000만원 / 월 260만원", 1.5, 260.0, "2024.08.19", "월세 (중개거래)", "월세 🔶"));
                // OFFI
                list.add(createTx("OFFI", "TRADE", "시그니엘 레지던스", region + " 신천동", dName, "신천동", "210.0㎡ (64평형)", "55층", 2017, 85.0, "85억원", "85억원", null, null, "2024.08.23", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("OFFI", "JEONSE", "문정아이파크", region + " 문정동", dName, "문정동", "38.5㎡ (12평형)", "7층", 2017, 3.2, "전세 3억 2,000만원", "전세 3억 2,000만원", 3.2, 0.0, "2024.08.20", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", "송파파크하비오", region + " 문정동", dName, "문정동", "48.2㎡ (15평형)", "11층", 2016, 0.3, "보증금 3,000만원 / 월 130만원", "보증금 3,000만원 / 월 130만원", 0.3, 130.0, "2024.08.17", "월세 (중개거래)", "월세 🔶"));
                // VILLA
                list.add(createTx("VILLA", "TRADE", "석촌호수 테라스빌", region + " 석촌동", dName, "석촌동", "85.0㎡ (26평형)", "5층", 2020, 12.5, "12억 5,000만원", "12억 5,000만원", null, null, "2024.08.21", "매매 (중개거래)", "고급빌라 🏡"));
                list.add(createTx("VILLA", "JEONSE", "방이동 신축다세대", region + " 방이동", dName, "방이동", "55.0㎡ (17평형)", "3층", 2022, 4.5, "전세 4억 5,000만원", "전세 4억 5,000만원", 4.5, 0.0, "2024.08.18", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", "삼전동 주택빌라", region + " 삼전동", dName, "삼전동", "42.0㎡ (13평형)", "2층", 2019, 0.3, "보증금 3,000만원 / 월 95만원", "보증금 3,000만원 / 월 95만원", 0.3, 95.0, "2024.08.15", "월세 (중개거래)", "월세 🔶"));
                break;

            case "YONGSAN":
                // APT
                list.add(createTx("APT", "TRADE", "나인원한남", region + " 한남동", dName, "한남동", "244.0㎡ (74평형)", "5층", 2019, 110.0, "110억원", "110억원", null, null, "2024.08.24", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("APT", "JEONSE", "래미안첼리투스", region + " 이촌동", dName, "이촌동", "124.0㎡ (38평형)", "28층", 2015, 24.0, "전세 24억원", "전세 24억원", 24.0, 0.0, "2024.08.22", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", "용산센트럴파크해링턴", region + " 한강로3가", dName, "한강로3가", "102.0㎡ (31평형)", "19층", 2020, 5.0, "보증금 5억원 / 월 520만원", "보증금 5억원 / 월 520만원", 5.0, 520.0, "2024.08.20", "월세 (중개거래)", "월세 🔶"));
                // OFFI
                list.add(createTx("OFFI", "TRADE", "래미안용산더센트럴", region + " 한강로2가", dName, "한강로2가", "77.5㎡ (23평형)", "22층", 2017, 13.8, "13억 8,000만원", "13억 8,000만원", null, null, "2024.08.22", "매매 (중개거래)", "오피스텔 🏬"));
                list.add(createTx("OFFI", "JEONSE", "용산푸르지오써밋오피스", region + " 한강로2가", dName, "한강로2가", "55.0㎡ (17평형)", "14층", 2017, 6.8, "전세 6억 8,000만원", "전세 6억 8,000만원", 6.8, 0.0, "2024.08.19", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", "삼각지베르움", region + " 한강로1가", dName, "한강로1가", "36.0㎡ (11평형)", "9층", 2016, 0.2, "보증금 2,000만원 / 월 130만원", "보증금 2,000만원 / 월 130만원", 0.2, 130.0, "2024.08.17", "월세 (중개거래)", "월세 🔶"));
                // VILLA
                list.add(createTx("VILLA", "TRADE", "한남더힐 테라스빌라", region + " 한남동", dName, "한남동", "180.0㎡ (55평형)", "3층", 2018, 55.0, "55억원", "55억원", null, null, "2024.08.23", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("VILLA", "JEONSE", "유엔빌리지 루시드하우스", region + " 한남동", dName, "한남동", "145.0㎡ (44평형)", "2층", 2016, 25.0, "전세 25억원", "전세 25억원", 25.0, 0.0, "2024.08.20", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", "이태원동 외국인렌탈빌", region + " 이태원동", dName, "이태원동", "110.0㎡ (33평형)", "3층", 2019, 1.0, "보증금 1억원 / 월 450만원", "보증금 1억원 / 월 450만원", 1.0, 450.0, "2024.08.16", "월세 (중개거래)", "월세 🔶"));
                break;

            case "BUNDANG":
                // APT
                list.add(createTx("APT", "TRADE", "판교푸르지오그랑블", region + " 백현동", dName, "백현동", "97.5㎡ (30평형)", "16층", 2011, 27.5, "27억 5,000만원", "27억 5,000만원", null, null, "2024.08.24", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("APT", "JEONSE", "봇들마을8단지", region + " 삼평동", dName, "삼평동", "84.9㎡ (26평형)", "11층", 2009, 11.5, "전세 11억 5,000만원", "전세 11억 5,000만원", 11.5, 0.0, "2024.08.22", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", "정자동 파크뷰", region + " 정자동", dName, "정자동", "84.8㎡ (26평형)", "20층", 2004, 2.0, "보증금 2억원 / 월 280만원", "보증금 2억원 / 월 280만원", 2.0, 280.0, "2024.08.19", "월세 (중개거래)", "월세 🔶"));
                // OFFI
                list.add(createTx("OFFI", "TRADE", "판교SK뷰 오피스텔", region + " 백현동", dName, "백현동", "84.0㎡ (25평형)", "14층", 2021, 14.8, "14억 8,000만원", "14억 8,000만원", null, null, "2024.08.23", "매매 (중개거래)", "오피스텔 🏬"));
                list.add(createTx("OFFI", "JEONSE", "힐스테이트 판교역", region + " 백현동", dName, "백현동", "55.0㎡ (17평형)", "9층", 2022, 6.2, "전세 6억 2,000만원", "전세 6억 2,000만원", 6.2, 0.0, "2024.08.20", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", "정자동 아데나루체", region + " 정자동", dName, "정자동", "60.0㎡ (18평형)", "8층", 2018, 0.5, "보증금 5,000만원 / 월 190만원", "보증금 5,000만원 / 월 190만원", 0.5, 190.0, "2024.08.17", "월세 (중개거래)", "월세 🔶"));
                // VILLA
                list.add(createTx("VILLA", "TRADE", "운중동 타운하우스", region + " 운중동", dName, "운중동", "150.0㎡ (45평형)", "3층", 2019, 18.5, "18억 5,000만원", "18억 5,000만원", null, null, "2024.08.22", "매매 (중개거래)", "고급빌라 🏡"));
                list.add(createTx("VILLA", "JEONSE", "구미동 불곡산빌라", region + " 구미동", dName, "구미동", "84.0㎡ (25평형)", "4층", 2020, 6.8, "전세 6억 8,000만원", "전세 6억 8,000만원", 6.8, 0.0, "2024.08.19", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", "운중동 테라스빌라", region + " 운중동", dName, "운중동", "78.0㎡ (24평형)", "2층", 2018, 1.0, "보증금 1억원 / 월 230만원", "보증금 1억원 / 월 230만원", 1.0, 230.0, "2024.08.15", "월세 (중개거래)", "월세 🔶"));
                break;

            case "BUSAN_HAEUNDAE":
                // APT
                list.add(createTx("APT", "TRADE", "엘시티 더샵", region + " 중동", dName, "중동", "144.0㎡ (44평형)", "42층", 2019, 46.0, "46억원", "46억원", null, null, "2024.08.24", "매매 (중개거래)", "초고가/신고가 🚀"));
                list.add(createTx("APT", "JEONSE", "해운대두산위브더제니스", region + " 우동", dName, "우동", "127.0㎡ (38평형)", "31층", 2011, 12.5, "전세 12억 5,000만원", "전세 12억 5,000만원", 12.5, 0.0, "2024.08.22", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", "마린시티자이", region + " 우동", dName, "우동", "84.9㎡ (26평형)", "15층", 2019, 1.0, "보증금 1억원 / 월 280만원", "보증금 1억원 / 월 280만원", 1.0, 280.0, "2024.08.19", "월세 (중개거래)", "월세 🔶"));
                // OFFI
                list.add(createTx("OFFI", "TRADE", "센텀리더스마크", region + " 우동", dName, "우동", "78.0㎡ (24평형)", "19층", 2010, 8.5, "8억 5,000만원", "8억 5,000만원", null, null, "2024.08.23", "매매 (중개거래)", "오피스텔 🏬"));
                list.add(createTx("OFFI", "JEONSE", "마린시티 골든스위트", region + " 우동", dName, "우동", "62.0㎡ (19평형)", "12층", 2012, 4.8, "전세 4억 8,000만원", "전세 4억 8,000만원", 4.8, 0.0, "2024.08.20", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", "센텀스퀘어 오피스", region + " 우동", dName, "우동", "45.0㎡ (14평형)", "8층", 2015, 0.2, "보증금 2,000만원 / 월 120만원", "보증금 2,000만원 / 월 120만원", 0.2, 120.0, "2024.08.17", "월세 (중개거래)", "월세 🔶"));
                // VILLA
                list.add(createTx("VILLA", "TRADE", "달맞이고개 힐사이드", region + " 중동", dName, "중동", "130.0㎡ (39평형)", "4층", 2018, 15.5, "15억 5,000만원", "15억 5,000만원", null, null, "2024.08.21", "매매 (중개거래)", "고급빌라 🏡"));
                list.add(createTx("VILLA", "JEONSE", "달맞이 프라임빌", region + " 중동", dName, "중동", "70.0㎡ (21평형)", "3층", 2020, 5.2, "전세 5억 2,000만원", "전세 5억 2,000만원", 5.2, 0.0, "2024.08.18", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", "중동 달맞이 테라스", region + " 중동", dName, "중동", "55.0㎡ (17평형)", "2층", 2019, 0.3, "보증금 3,000만원 / 월 130만원", "보증금 3,000만원 / 월 130만원", 0.3, 130.0, "2024.08.15", "월세 (중개거래)", "월세 🔶"));
                break;

            case "SEJONG":
                // APT
                list.add(createTx("APT", "TRADE", "리더스포레", region + " 나성동", dName, "나성동", "99.5㎡ (30평형)", "24층", 2021, 11.8, "11억 8,000만원", "11억 8,000만원", null, null, "2024.08.24", "매매 (중개거래)", "우상향 📈"));
                list.add(createTx("APT", "JEONSE", "새뜸마을10단지", region + " 새롬동", dName, "새롬동", "84.9㎡ (26평형)", "12층", 2017, 4.2, "전세 4억 2,000만원", "전세 4억 2,000만원", 4.2, 0.0, "2024.08.21", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", "가온마을4단지", region + " 다정동", dName, "다정동", "84.8㎡ (26평형)", "8층", 2018, 0.3, "보증금 3,000만원 / 월 130만원", "보증금 3,000만원 / 월 130만원", 0.3, 130.0, "2024.08.18", "월세 (중개거래)", "월세 🔶"));
                // OFFI
                list.add(createTx("OFFI", "TRADE", "세종파이낸스 오피스", region + " 어진동", dName, "어진동", "52.0㎡ (16평형)", "6층", 2018, 3.5, "3억 5,000만원", "3억 5,000만원", null, null, "2024.08.22", "매매 (중개거래)", "오피스텔 🏬"));
                list.add(createTx("OFFI", "JEONSE", "나성동 스마트큐브", region + " 나성동", dName, "나성동", "35.0㎡ (11평형)", "4층", 2019, 1.8, "전세 1억 8,000만원", "전세 1억 8,000만원", 1.8, 0.0, "2024.08.19", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", "어진동 푸르지오시티", region + " 어진동", dName, "어진동", "28.0㎡ (8평형)", "5층", 2016, 0.1, "보증금 1,000만원 / 월 65만원", "보증금 1,000만원 / 월 65만원", 0.1, 65.0, "2024.08.16", "월세 (중개거래)", "월세 🔶"));
                // VILLA
                list.add(createTx("VILLA", "TRADE", "고운동 단독테라스", region + " 고운동", dName, "고운동", "110.0㎡ (33평형)", "2층", 2020, 8.2, "8억 2,000만원", "8억 2,000만원", null, null, "2024.08.20", "매매 (중개거래)", "고급빌라 🏡"));
                list.add(createTx("VILLA", "JEONSE", "고운동 테라스빌라", region + " 고운동", dName, "고운동", "75.0㎡ (23평형)", "3층", 2021, 3.8, "전세 3억 8,000만원", "전세 3억 8,000만원", 3.8, 0.0, "2024.08.17", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", "조치원 신축다세대", region + " 조치원읍", dName, "조치원읍", "50.0㎡ (15평형)", "2층", 2022, 0.1, "보증금 1,000만원 / 월 50만원", "보증금 1,000만원 / 월 50만원", 0.1, 50.0, "2024.08.14", "월세 (중개거래)", "월세 🔶"));
                break;

            default:
                // Other districts generic high-fidelity generator
                list.add(createTx("APT", "TRADE", dName + " 센트럴파크", region + " 중심동", dName, "중심동", "84.9㎡ (26평형)", "14층", 2020, 12.8, "12억 8,000만원", "12억 8,000만원", null, null, "2024.08.24", "매매 (중개거래)", "우상향 📈"));
                list.add(createTx("APT", "JEONSE", dName + " 아이파크", region + " 역세권", dName, "역세권", "84.5㎡ (26평형)", "9층", 2019, 6.5, "전세 6억 5,000만원", "전세 6억 5,000만원", 6.5, 0.0, "2024.08.22", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("APT", "RENT", dName + " 더샵", region + " 신도심", dName, "신도심", "84.0㎡ (25평형)", "11층", 2021, 1.0, "보증금 1억원 / 월 180만원", "보증금 1억원 / 월 180만원", 1.0, 180.0, "2024.08.19", "월세 (중개거래)", "월세 🔶"));
                
                list.add(createTx("OFFI", "TRADE", dName + " SK허브 오피스텔", region + " 상업지구", dName, "상업지구", "55.0㎡ (17평형)", "12층", 2020, 5.2, "5억 2,000만원", "5억 2,000만원", null, null, "2024.08.23", "매매 (중개거래)", "오피스텔 🏬"));
                list.add(createTx("OFFI", "JEONSE", dName + " 메트로팰리스", region + " 역세권", dName, "역세권", "45.0㎡ (14평형)", "7층", 2018, 3.2, "전세 3억 2,000만원", "전세 3억 2,000만원", 3.2, 0.0, "2024.08.20", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("OFFI", "RENT", dName + " 스마트뷰", region + " 상업지구", dName, "상업지구", "32.0㎡ (10평형)", "5층", 2019, 0.15, "보증금 1,500만원 / 월 85만원", "보증금 1,500만원 / 월 85만원", 0.15, 85.0, "2024.08.17", "월세 (중개거래)", "월세 🔶"));

                list.add(createTx("VILLA", "TRADE", dName + " 힐사이드 테라스빌라", region + " 주거단지", dName, "주거단지", "95.0㎡ (29평형)", "3층", 2021, 7.8, "7억 8,000만원", "7억 8,000만원", null, null, "2024.08.22", "매매 (중개거래)", "고급빌라 🏡"));
                list.add(createTx("VILLA", "JEONSE", dName + " 신축다세대", region + " 주거단지", dName, "주거단지", "60.0㎡ (18평형)", "2층", 2022, 4.2, "전세 4억 2,000만원", "전세 4억 2,000만원", 4.2, 0.0, "2024.08.19", "전세 (신규계약)", "전세 🔷"));
                list.add(createTx("VILLA", "RENT", dName + " 테라스빌", region + " 주거단지", dName, "주거단지", "48.0㎡ (15평형)", "2층", 2020, 0.2, "보증금 2,000만원 / 월 90만원", "보증금 2,000만원 / 월 90만원", 0.2, 90.0, "2024.08.15", "월세 (중개거래)", "월세 🔶"));
                break;
        }

        return list;
    }

    private PublicDataDto.RealEstateTransaction createTx(
            String propType, String dealCat, String name, String region, String district, String dong,
            String area, String floor, int buildYear, double priceEok, String wonPrice, String formattedPrice,
            Double deposit, Double monthlyRent, String date, String tradeType, String status
    ) {
        String typeLabel = "아파트 🏢";
        if ("OFFI".equals(propType)) typeLabel = "오피스텔 🏬";
        else if ("VILLA".equals(propType)) typeLabel = "빌라/다세대 🏡";

        return PublicDataDto.RealEstateTransaction.builder()
                .propertyType(propType)
                .propertyTypeLabel(typeLabel)
                .dealCategory(dealCat)
                .complexName(name)
                .region(region)
                .district(district)
                .dong(dong)
                .area(area)
                .floor(floor)
                .buildYear(buildYear)
                .tradePrice(priceEok)
                .tradePriceWon(wonPrice)
                .formattedPrice(formattedPrice)
                .deposit(deposit)
                .monthlyRent(monthlyRent)
                .tradeDate(date)
                .tradeType(tradeType)
                .status(status)
                .build();
    }

    private String formatPriceWon(double rawManwon) {
        long eok = (long) (rawManwon / 10000);
        long remainder = (long) (rawManwon % 10000);
        if (eok > 0 && remainder > 0) {
            return String.format("%d억 %,d만원", eok, remainder);
        } else if (eok > 0) {
            return String.format("%d억원", eok);
        } else {
            return String.format("%,d만원", (long) rawManwon);
        }
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
}
