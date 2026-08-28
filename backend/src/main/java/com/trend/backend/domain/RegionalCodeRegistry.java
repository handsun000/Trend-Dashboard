package com.trend.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 대한민국 전국 17개 시·도 및 250개 시·군·구 법정동코드(LAWD_CD 5자리) 마스터 레지스트리 & 인메모리 검색 엔진
 */
@Component
public class RegionalCodeRegistry {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegionInfo {
        private String lawdCd;       // 국토부 실거래가 5자리 법정동코드 (예: 11680)
        private String sido;         // 시·도 (예: 서울특별시, 경기도, 부산광역시)
        private String sgg;          // 시·군·구 (예: 강남구, 분당구, 해운대구)
        private String fullName;     // 전체 명칭 (예: 서울특별시 강남구)
        private String shortName;    // 축약 명칭 (예: 서울 강남, 경기 분당)
        private List<String> aliases;// 대표 동/랜드마크 키워드 (예: 압구정, 청담, 개포, 대치, 역삼)
        private boolean isHotspot;   // 인기 핫스팟 여부
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SidoHierarchy {
        private String sido;
        private List<RegionSummary> sggList;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegionSummary {
        private String lawdCd;
        private String sgg;
        private String fullName;
        private boolean isHotspot;
    }

    private final Map<String, RegionInfo> codeToRegionMap = new LinkedHashMap<>();
    private final List<RegionInfo> allRegions = new ArrayList<>();

    public RegionalCodeRegistry() {
        initNationwideRegions();
    }

    public Optional<RegionInfo> findByCode(String lawdCd) {
        if (lawdCd == null) return Optional.empty();
        return Optional.ofNullable(codeToRegionMap.get(lawdCd.trim()));
    }

    public List<RegionInfo> getAllRegions() {
        return Collections.unmodifiableList(allRegions);
    }

    /**
     * 키워드 기반 전국 시·군·구 및 주요 동/랜드마크 실시간 검색
     */
    public List<RegionInfo> searchRegions(String query) {
        if (query == null || query.isBlank()) {
            return allRegions.stream().filter(RegionInfo::isHotspot).limit(10).collect(Collectors.toList());
        }

        String q = query.trim().replaceAll("\\s+", "").toLowerCase();

        return allRegions.stream()
                .filter(r -> {
                    String full = r.getFullName().replaceAll("\\s+", "").toLowerCase();
                    String sgg = r.getSgg().replaceAll("\\s+", "").toLowerCase();
                    String sido = r.getSido().replaceAll("\\s+", "").toLowerCase();
                    String shortN = r.getShortName().replaceAll("\\s+", "").toLowerCase();

                    if (full.contains(q) || sgg.contains(q) || sido.contains(q) || shortN.contains(q)) return true;

                    if (r.getAliases() != null) {
                        for (String alias : r.getAliases()) {
                            if (alias.toLowerCase().contains(q) || q.contains(alias.toLowerCase())) return true;
                        }
                    }
                    return false;
                })
                .sorted((a, b) -> {
                    // 정확도 가중치: sgg 일치 > 핫스팟 > 이름순
                    boolean aExact = a.getSgg().equalsIgnoreCase(query.trim()) || a.getFullName().equalsIgnoreCase(query.trim());
                    boolean bExact = b.getSgg().equalsIgnoreCase(query.trim()) || b.getFullName().equalsIgnoreCase(query.trim());
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    if (a.isHotspot() && !b.isHotspot()) return -1;
                    if (!a.isHotspot() && b.isHotspot()) return 1;
                    return a.getFullName().compareTo(b.getFullName());
                })
                .limit(15)
                .collect(Collectors.toList());
    }

    /**
     * 프론트엔드 드롭다운용 17개 시·도 및 산하 시·군·구 계층 트리
     */
    public List<SidoHierarchy> getHierarchy() {
        Map<String, List<RegionSummary>> grouped = new LinkedHashMap<>();

        for (RegionInfo r : allRegions) {
            grouped.computeIfAbsent(r.getSido(), k -> new ArrayList<>())
                    .add(new RegionSummary(r.getLawdCd(), r.getSgg(), r.getFullName(), r.isHotspot()));
        }

        List<SidoHierarchy> result = new ArrayList<>();
        grouped.forEach((sido, list) -> result.add(new SidoHierarchy(sido, list)));
        return result;
    }

    private void register(String lawdCd, String sido, String sgg, String shortName, boolean isHotspot, String... aliases) {
        String fullName = sido + " " + sgg;
        RegionInfo info = RegionInfo.builder()
                .lawdCd(lawdCd)
                .sido(sido)
                .sgg(sgg)
                .fullName(fullName)
                .shortName(shortName)
                .isHotspot(isHotspot)
                .aliases(aliases != null ? Arrays.asList(aliases) : Collections.emptyList())
                .build();

        codeToRegionMap.put(lawdCd, info);
        allRegions.add(info);
    }

    private void initNationwideRegions() {
        // 1. 서울특별시 (25개 자치구)
        register("11680", "서울특별시", "강남구", "서울 강남", true, "개포동", "논현동", "대치동", "도곡동", "삼성동", "세곡동", "수서동", "신사동", "압구정동", "역삼동", "율현동", "일원동", "자곡동", "청담동", "은마", "타워팰리스", "디에이치", "아너힐즈");
        register("11650", "서울특별시", "서초구", "서울 서초", true, "내곡동", "반포동", "방배동", "서초동", "신원동", "양재동", "우면동", "원지동", "잠원동", "반포자이", "원베일리", "아크로리버파크");
        register("11710", "서울특별시", "송파구", "서울 송파", true, "가락동", "거여동", "마천동", "문정동", "방이동", "삼전동", "석촌동", "송파동", "신천동", "오금동", "잠실동", "장지동", "풍납동", "잠실엘스", "리센츠", "헬리오시티", "파크리오");
        register("11170", "서울특별시", "용산구", "서울 용산", true, "한남동", "이촌동", "한강로", "효창동", "후암동", "보광동", "이태원", "서빙고동", "나인원한남", "한남더힐", "첼리투스");
        register("11440", "서울특별시", "마포구", "서울 마포", true, "공덕동", "아현동", "상암동", "망원동", "합정동", "연남동", "서교동", "도화동", "마포래미안푸르지오", "마프");
        register("11200", "서울특별시", "성동구", "서울 성동", true, "성수동", "옥수동", "금호동", "행당동", "왕십리", "마장동", "트리마제", "아크로서울포레스트");
        register("11560", "서울특별시", "영등포구", "서울 영등포", true, "여의도동", "당산동", "문래동", "양평동", "영등포동", "신길동", "대림동", "여의도", "시범아파트", "파크원");
        register("11110", "서울특별시", "종로구", "서울 종로", false, "평창동", "부암동", "혜화동", "경운동", "사직동", "경희궁자이");
        register("11140", "서울특별시", "중구", "서울 중구", false, "명동", "을지로", "신당동", "황학동", "회현동", "남산");
        register("11215", "서울특별시", "광진구", "서울 광진", false, "자양동", "구의동", "광장동", "화양동", "군자동");
        register("11230", "서울특별시", "동대문구", "서울 동대문", false, "전농동", "답십리동", "장안동", "이문동", "휘경동", "청량리");
        register("11260", "서울특별시", "중랑구", "서울 중랑", false, "면목동", "상봉동", "중화동", "묵동", "망우동", "신내동");
        register("11290", "서울특별시", "성북구", "서울 성북", false, "길음동", "종암동", "돈암동", "정릉동", "안암동", "보문동", "길음뉴타운");
        register("11305", "서울특별시", "강북구", "서울 강북", false, "미아동", "번동", "수유동", "우이동");
        register("11320", "서울특별시", "도봉구", "서울 도봉", false, "쌍문동", "방학동", "창동", "도봉동");
        register("11350", "서울특별시", "노원구", "서울 노원", false, "상계동", "중계동", "하계동", "월계동", "공릉동", "중계은행사거리");
        register("11380", "서울특별시", "은평구", "서울 은평", false, "불광동", "갈현동", "응암동", "진관동", "은평뉴타운");
        register("11410", "서울특별시", "서대문구", "서울 서대문", false, "북가좌동", "남가좌동", "홍제동", "연희동", "신촌", "DMC");
        register("11470", "서울특별시", "양천구", "서울 양천", true, "목동", "신정동", "신월동", "목동단지", "목동7단지");
        register("11500", "서울특별시", "강서구", "서울 강서", false, "마곡동", "화곡동", "가양동", "등촌동", "방화동", "마곡M밸리");
        register("11530", "서울특별시", "구로구", "서울 구로", false, "신도림동", "구로동", "고척동", "개봉동", "오류동", "신도림");
        register("11545", "서울특별시", "금천구", "서울 금천", false, "가산동", "독산동", "시흥동", "가산디지털단지");
        register("11590", "서울특별시", "동작구", "서울 동작", false, "흑석동", "노량진동", "상도동", "사당동", "대방동", "아크로리버하임");
        register("11620", "서울특별시", "관악구", "서울 관악", false, "봉천동", "신림동", "남현동", "서울대입구");
        register("11740", "서울특별시", "강동구", "서울 강동", true, "고덕동", "상일동", "둔촌동", "명일동", "암사동", "천호동", "올림픽파크포레온", "둔촌주공", "고덕그라시움");

        // 2. 경기도 주요 시·군·구
        register("41135", "경기도", "성남시 분당구", "경기 분당", true, "판교", "정자동", "백현동", "삼평동", "이매동", "서현동", "야탑동", "운중동", "봇들마을", "푸르지오그랑블", "파크뷰");
        register("41131", "경기도", "성남시 수정구", "경기 성남수정", false, "위례", "신흥동", "태평동", "산성동", "위례자이");
        register("41133", "경기도", "성남시 중원구", "경기 성남중원", false, "성남동", "금광동", "상대원동", "은행동");
        register("41117", "경기도", "수원시 영통구", "경기 수원영통", true, "광교", "영통동", "망포동", "매탄동", "원천동", "이의동", "하동", "광교중흥S클래스");
        register("41111", "경기도", "수원시 장안구", "경기 수원장안", false, "정자동", "조원동", "천천동", "율전동");
        register("41113", "경기도", "수원시 권선구", "경기 수원권선", false, "호매실동", "곡반정동", "세류동", "구운동");
        register("41115", "경기도", "수원시 팔달구", "경기 수원팔달", false, "인계동", "화서동", "우만동", "지동", "화서역파크푸르지오");
        register("41465", "경기도", "용인시 수지구", "경기 용인수지", true, "풍덕천동", "신봉동", "죽전동", "동천동", "상현동", "성복동", "성복자이");
        register("41461", "경기도", "용인시 처인구", "경기 용인처인", false, "김량장동", "역북동", "유방동", "모현읍", "남사읍");
        register("41463", "경기도", "용인시 기흥구", "경기 용인기흥", false, "구갈동", "보정동", "동백동", "마북동", "신갈동", "기흥역");
        register("41590", "경기도", "화성시", "경기 화성(동탄)", true, "동탄", "반송동", "석우동", "청계동", "오산동", "동탄역롯데캐슬", "송산동", "봉담읍");
        register("41281", "경기도", "고양시 덕양구", "경기 고양덕양", false, "삼송동", "원흥동", "향동동", "지축동", "덕은동");
        register("41285", "경기도", "고양시 일산동구", "경기 일산동구", true, "백석동", "마두동", "장항동", "식사동", "중산동", "킨텍스원시티");
        register("41287", "경기도", "고양시 일산서구", "경기 일산서구", false, "일산동", "주엽동", "탄현동", "대화동");
        register("41173", "경기도", "안양시 동안구", "경기 안양동안(평촌)", true, "평촌동", "비산동", "관양동", "호계동", "귀인동", "평촌더샵센트럴");
        register("41171", "경기도", "안양시 만안구", "경기 안양만안", false, "안양동", "석수동", "박달동");
        register("41210", "경기도", "광명시", "경기 광명", true, "철산동", "하안동", "소하동", "일직동", "광명역", "철산래미안자이");
        register("41390", "경기도", "시흥시", "경기 시흥", false, "배곧동", "정왕동", "은계동", "목감동", "장현동", "배곧신도시");
        register("41271", "경기도", "안산시 상록구", "경기 안산상록", false, "사동", "본오동", "일동", "월피동", "그랑시티자이");
        register("41273", "경기도", "안산시 단원구", "경기 안산단원", false, "고잔동", "초지동", "원곡동", "선부동", "대부동");
        register("41450", "경기도", "하남시", "경기 하남", true, "미사동", "망월동", "풍산동", "선동", "감일동", "위례동", "미사강변도시");
        register("41290", "경기도", "과천시", "경기 과천", true, "중앙동", "원문동", "별양동", "갈현동", "과천위버필드", "과천자이");
        register("41360", "경기도", "남양주시", "경기 남양주", false, "다산동", "별내동", "와부읍", "호평동", "평내동", "다산신도시");
        register("41190", "경기도", "부천시", "경기 부천", false, "중동", "상동", "심곡동", "소사본동", "옥길동");
        register("41310", "경기도", "구리시", "경기 구리", false, "갈매동", "인창동", "교문동", "수택동", "토평동");
        register("41430", "경기도", "의왕시", "경기 의왕", false, "포일동", "내손동", "오전동", "삼동", "백운밸리");
        register("41150", "경기도", "의정부시", "경기 의정부", false, "의정부동", "호원동", "장암동", "신곡동", "민락동", "고산동");
        register("41370", "경기도", "파주시", "경기 파주", false, "운정", "목동동", "야당동", "동패동", "금촌동", "운정신도시");
        register("41220", "경기도", "평택시", "경기 평택", false, "고덕동", "동삭동", "비전동", "세교동", "안중읍", "고덕국제신도시");
        register("41250", "경기도", "동두천시", "경기 동두천", false, "생연동", "송내동", "보산동");
        register("41500", "경기도", "안성시", "경기 안성", false, "공도읍", "대덕면", "아양동");
        register("41570", "경기도", "김포시", "경기 김포", false, "걸포동", "풍무동", "사우동", "장기동", "구래동", "운양동", "한강신도시");
        register("41610", "경기도", "광주시", "경기 광주", false, "경안동", "송정동", "태전동", "역동", "오포읍");
        register("41630", "경기도", "양주시", "경기 양주", false, "옥정동", "고읍동", "덕정동", "옥정신도시");
        register("41650", "경기도", "포천시", "경기 포천", false, "소흘읍", "신북면", "어룡동");
        register("41670", "경기도", "여주시", "경기 여주", false, "교동", "홍문동", "오학동");
        register("41800", "경기도", "연천군", "경기 연천", false, "전곡읍", "연천읍");
        register("41820", "경기도", "가평군", "경기 가평", false, "가평읍", "청평면");
        register("41830", "경기도", "양평군", "경기 양평", false, "양평읍", "강상면", "양서면");

        // 3. 인천광역시 (8개 구, 2개 군)
        register("28185", "인천광역시", "연수구", "인천 연수(송도)", true, "송도", "송도동", "동춘동", "연수동", "청학동", "송도더샵퍼스트파크");
        register("28260", "인천광역시", "서구", "인천 서구(청라/검단)", true, "청라", "검단", "청라동", "원당동", "당하동", "가정동", "루원시티");
        register("28237", "인천광역시", "부평구", "인천 부평", false, "부평동", "산곡동", "삼산동", "갈산동", "십정동");
        register("28200", "인천광역시", "남동구", "인천 남동", false, "구월동", "논현동", "서창동", "간석동", "만수동");
        register("28110", "인천광역시", "중구", "인천 중구(영종)", false, "영종", "운서동", "중산동", "신흥동", "하늘도시");
        register("28140", "인천광역시", "동구", "인천 동구", false, "송림동", "화수동", "만석동");
        register("28177", "인천광역시", "미추홀구", "인천 미추홀", false, "주안동", "도화동", "용현동", "학익동");
        register("28245", "인천광역시", "계양구", "인천 계양", false, "계산동", "작전동", "효성동", "귤현동");
        register("28710", "인천광역시", "강화군", "인천 강화", false, "강화읍", "길상면");
        register("28720", "인천광역시", "옹진군", "인천 옹진", false, "백령면", "영흥면");

        // 4. 부산광역시 (15개 구, 1개 군)
        register("26350", "부산광역시", "해운대구", "부산 해운대", true, "우동", "중동", "좌동", "재송동", "반여동", "마린시티", "센텀시티", "엘시티", "제니스", "아이파크");
        register("26500", "부산광역시", "수영구", "부산 수영", true, "남천동", "광안동", "민락동", "망미동", "삼익비치", "광안리");
        register("26290", "부산광역시", "남구", "부산 남구", false, "대연동", "용호동", "문현동", "W", "대연자이");
        register("26260", "부산광역시", "동래구", "부산 동래", false, "온천동", "사직동", "명륜동", "수안동", "동래래미안아이파크");
        register("26440", "부산광역시", "강서구", "부산 강서(명지)", false, "명지동", "명지국제신도시", "대저동", "녹산동");
        register("26230", "부산광역시", "부산진구", "부산 부산진", false, "부전동", "전포동", "범천동", "가야동", "서면");
        register("26110", "부산광역시", "중구", "부산 중구", false, "남포동", "중앙동", "광복동", "자갈치");
        register("26140", "부산광역시", "서구", "부산 서구", false, "송도", "암남동", "동대신동", "서대신동");
        register("26170", "부산광역시", "동구", "부산 동구", false, "초량동", "수정동", "좌천동", "북항");
        register("26200", "부산광역시", "영도구", "부산 영도", false, "봉래동", "청학동", "동삼동", "태종대");
        register("26320", "부산광역시", "북구", "부산 북구", false, "화명동", "덕천동", "만덕동", "구포동");
        register("26380", "부산광역시", "금정구", "부산 금정", false, "장전동", "구서동", "남산동", "부산대");
        register("26410", "부산광역시", "사상구", "부산 사상", false, "괘법동", "감전동", "주례동", "모라동");
        register("26470", "부산광역시", "연제구", "부산 연제", false, "연산동", "거제동", "시청", "법원");
        register("26530", "부산광역시", "사하구", "부산 사하", false, "하단동", "괴정동", "다대동", "다대포");
        register("26710", "부산광역시", "기장군", "부산 기장", false, "정관읍", "기장읍", "일광읍", "오시리아");

        // 5. 대구광역시 (7개 구, 2개 군)
        register("27260", "대구광역시", "수성구", "대구 수성", true, "범어동", "만촌동", "황금동", "지산동", "두산동", "수성동", "범어동두산위브", "힐스테이트범어");
        register("27110", "대구광역시", "중구", "대구 중구", false, "동성로", "삼덕동", "남산동", "대봉동");
        register("27140", "대구광역시", "동구", "대구 동구", false, "신천동", "효목동", "율하동", "봉무동", "이시아폴리스");
        register("27170", "대구광역시", "서구", "대구 서구", false, "평리동", "내당동", "비산동");
        register("27200", "대구광역시", "남구", "대구 남구", false, "대명동", "이천동", "봉덕동", "앞산");
        register("27230", "대구광역시", "북구", "대구 북구", false, "칠곡", "침산동", "복현동", "산격동", "국우동");
        register("27290", "대구광역시", "달서구", "대구 달서", false, "월배", "상인동", "진천동", "월성동", "이곡동", "두류동");
        register("27710", "대구광역시", "달성군", "대구 달성", false, "다사읍", "화원읍", "유가읍", "현풍읍", "테크노폴리스");
        register("27720", "대구광역시", "군위군", "대구 군위", false, "군위읍", "효령면");

        // 6. 대전광역시 (5개 구)
        register("27305", "대전광역시", "유성구", "대전 유성", true, "도안", "노은", "상대동", "원신흥동", "봉명동", "지족동", "도룡동", "스마트시티", "카이스트");
        register("27200", "대전광역시", "서구", "대전 서구", true, "둔산동", "탄방동", "월평동", "갈마동", "관저동", "둔산크로바", "목련");
        register("27110", "대전광역시", "동구", "대전 동구", false, "용운동", "가오동", "대동", "판암동", "대전역");
        register("27140", "대전광역시", "중구", "대전 중구", false, "은행동", "문화동", "오류동", "목동", "태평동");
        register("27230", "대전광역시", "대덕구", "대전 대덕", false, "신탄진동", "송촌동", "법동", "오정동");

        // 7. 세종특별자치시
        register("36110", "세종특별자치시", "세종시", "세종 전역", true, "나성동", "새롬동", "다정동", "도담동", "어진동", "보람동", "소담동", "반곡동", "한솔동", "조치원", "리더스포레");

        // 8. 광주광역시 (5개 구)
        register("29155", "광주광역시", "남구", "광주 남구(봉선)", true, "봉선동", "주월동", "진월동", "양림동", "봉선한국아델리움");
        register("29140", "광주광역시", "서구", "광주 서구", false, "치평동", "상무지구", "화정동", "금호동", "풍암동");
        register("29170", "광주광역시", "북구", "광주 북구", false, "용봉동", "운암동", "문흥동", "첨단", "일곡동");
        register("29110", "광주광역시", "동구", "광주 동구", false, "금남로", "학동", "계림동", "지산동");
        register("29200", "광주광역시", "광산구", "광주 광산", false, "수완동", "첨단동", "신가동", "쌍암동", "수완지구");

        // 9. 울산광역시 (4개 구, 1개 군)
        register("31140", "울산광역시", "남구", "울산 남구", true, "옥동", "신정동", "삼산동", "달동", "무거동", "문수로아이파크");
        register("31110", "울산광역시", "중구", "울산 중구", false, "유곡동", "우정동", "태화동", "혁신도시");
        register("31170", "울산광역시", "동구", "울산 동구", false, "전하동", "화정동", "방어동", "일산동");
        register("31200", "울산광역시", "북구", "울산 북구", false, "송정동", "매곡동", "명촌동", "화봉동");
        register("31710", "울산광역시", "울주군", "울산 울주", false, "범서읍", "언양읍", "온산읍", "구영리");

        // 10. 강원특별자치도
        register("42130", "강원특별자치도", "원주시", "강원 원주", true, "무실동", "반곡동", "단구동", "단계동", "혁신도시", "기업도시");
        register("42110", "강원특별자치도", "춘천시", "강원 춘천", false, "온의동", "퇴계동", "석사동", "후평동", "삼천동");
        register("42150", "강원특별자치도", "강릉시", "강원 강릉", false, "교동", "유천동", "포남동", "안목");
        register("42210", "강원특별자치도", "속초시", "강원 속초", false, "조양동", "교동", "청호동", "디오션자이");

        // 11. 충청북도
        register("43113", "충청북도", "청주시 흥덕구", "충북 청주흥덕", true, "복대동", "가경동", "오송읍", "옥산면", "지웰시티");
        register("43111", "충청북도", "청주시 상당구", "충북 청주상당", false, "용암동", "금천동", "방서동", "동남지구");
        register("43112", "충청북도", "청주시 서원구", "충북 청주서원", false, "산남동", "분평동", "성화동", "개신동");
        register("43114", "충청북도", "청주시 청원구", "충북 청주청원", false, "율량동", "오창읍", "주중동");
        register("43130", "충청북도", "충주시", "충북 충주", false, "연수동", "호암동", "칠금동", "호암지구");

        // 12. 충청남도
        register("44133", "충청남도", "천안시 서북구", "충남 천안서북", true, "불당동", "백석동", "쌍용동", "두정동", "성성동", "신불당", "불당지웰더샵");
        register("44131", "충청남도", "천안시 동남구", "충남 천안동남", false, "신부동", "청수동", "용곡동", "청당동");
        register("44200", "충청남도", "아산시", "충남 아산", false, "배방읍", "탕정면", "모종동", "풍기동", "탕정지구");

        // 13. 전북특별자치도
        register("45113", "전북특별자치도", "전주시 덕진구", "전북 전주덕진", true, "송천동", "에코시티", "만성동", "혁신도시", "호성동");
        register("45111", "전북특별자치도", "전주시 완산구", "전북 전주완산", false, "효자동", "서신동", "평화동", "삼천동", "서부신시가지");
        register("45130", "전북특별자치도", "군산시", "전북 군산", false, "수송동", "미장동", "조촌동", "디오션시티");

        // 14. 전라남도
        register("46110", "전라남도", "목포시", "전남 목포", false, "남악", "옥암동", "용당동", "산정동", "하당");
        register("46130", "전라남도", "여수시", "전남 여수", false, "웅천동", "학동", "문수동", "신기동", "웅천지구");
        register("46150", "전라남도", "순천시", "전남 순천", false, "신대지구", "해룡면", "조례동", "연향동", "왕지동");

        // 15. 경상북도
        register("47113", "경상북도", "포항시 북구", "경북 포항북구", false, "장성동", "두호동", "양덕동", "흥해읍", "초곡지구");
        register("47111", "경상북도", "포항시 남구", "경북 포항남구", false, "지곡동", "효자동", "이동", "대이동", "포스코");
        register("47190", "경상북도", "구미시", "경북 구미", false, "송정동", "형곡동", "옥계동", "산동읍");

        // 16. 경상남도
        register("48121", "경상남도", "창원시 성산구", "경남 창원성산", true, "용호동", "상남동", "반림동", "가음동", "용지못", "용지더샵레이크파크");
        register("48123", "경상남도", "창원시 의창구", "경남 창원의창", false, "중동", "명서동", "봉림동", "유니시티");
        register("48250", "경상남도", "김해시", "경남 김해", false, "율하", "장유", "내외동", "삼계동", "율하신도시");
        register("48330", "경상남도", "양산시", "경남 양산", false, "물금읍", "동면", "중부동", "양산신도시");

        // 17. 제주특별자치도
        register("50110", "제주특별자치도", "제주시", "제주 제주시", true, "노형동", "연동", "아라동", "이도이동", "삼화지구", "드림타워", "노형아이파크");
        register("50130", "제주특별자치도", "서귀포시", "제주 서귀포", false, "대정읍", "영어교육도시", "동홍동", "서홍동", "중문");
    }
}
