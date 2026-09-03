package com.trend.backend.domain.korail;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 코레일 전국 주요 KTX/SRT 역 코드 및 역명 레지스트리
 */
@Component
public class KorailStationRegistry {

    public record Station(String name, String code, String line, boolean isMajor) {}

    private static final Map<String, String> NAME_TO_CODE = new HashMap<>();
    private static final Map<String, String> CODE_TO_NAME = new HashMap<>();
    private static final List<Station> STATION_LIST = new ArrayList<>();

    static {
        register("수서", "0551", "경부/호남 고속선(SRT)", true);
        register("부산", "0020", "경부선", true);
        register("서울", "0001", "경부선", true);
        register("용산", "0101", "호남/전라선", true);
        register("동대구", "0015", "경부선", true);
        register("대전", "0010", "경부선", true);
        register("광명", "0501", "경부선", true);
        register("울산", "0509", "경부선", true);
        register("광주송정", "0036", "호남선", true);
        register("익산", "0035", "호남/전라선", true);
        register("포항", "0515", "동해선", true);
        register("여수EXPO", "0087", "전라선", true);
        register("목포", "0041", "호남선", true);
        register("강릉", "0142", "강릉선", true);
        register("전주", "0043", "전라선", true);
        register("천안아산", "0502", "경부선", true);
        register("오송", "0297", "경부/호남선", true);
        register("신경주", "0508", "경부선", true);
        register("서대구", "0530", "경부선", false);
        register("영등포", "0002", "경부선", false);
        register("수원", "0023", "경부선", false);
        register("평택지제", "0553", "경부선(SRT)", false);
        register("동탄", "0552", "경부선(SRT)", false);
        register("서대전", "0011", "호남선", false);
        register("김천구미", "0507", "경부선", false);
        register("밀양", "0017", "경부선", false);
        register("구포", "0018", "경부선", false);
        register("창원중앙", "0520", "경전선", false);
        register("창원", "0029", "경전선", false);
        register("마산", "0031", "경전선", false);
        register("진주", "0034", "경전선", false);
        register("정읍", "0037", "호남선", false);
        register("나주", "0039", "호남선", false);
        register("남원", "0045", "전라선", false);
        register("순천", "0051", "전라선", false);
        register("청량리", "0086", "중앙/강릉선", false);
        register("원주", "0107", "중앙선", false);
        register("제천", "0109", "중앙선", false);
        register("안동", "0125", "중앙선", false);
        register("만종", "0561", "강릉선", false);
        register("횡성", "0562", "강릉선", false);
        register("평창", "0563", "강릉선", false);
        register("진부", "0564", "강릉선", false);
        register("동해", "0146", "강릉선", false);
    }

    private static void register(String name, String code, String line, boolean isMajor) {
        NAME_TO_CODE.put(name, code);
        CODE_TO_NAME.put(code, name);
        STATION_LIST.add(new Station(name, code, line, isMajor));
    }

    public String getCode(String stationName) {
        if (stationName == null) return null;
        String trimmed = stationName.trim();
        // 이미 4자리 숫자 코드인 경우 그대로 반환
        if (trimmed.matches("\\d{4}")) {
            return trimmed;
        }
        return NAME_TO_CODE.get(trimmed);
    }

    public String getName(String stationCode) {
        return CODE_TO_NAME.getOrDefault(stationCode, stationCode);
    }

    public List<Station> getAllStations() {
        return Collections.unmodifiableList(STATION_LIST);
    }

    public List<Station> getMajorStations() {
        return STATION_LIST.stream().filter(Station::isMajor).toList();
    }
}
