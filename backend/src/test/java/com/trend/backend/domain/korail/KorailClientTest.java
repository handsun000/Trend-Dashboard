package com.trend.backend.domain.korail;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class KorailClientTest {

    private final KorailCryptoService cryptoService = new KorailCryptoService();
    private final KorailStationRegistry stationRegistry = new KorailStationRegistry();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final KorailClient korailClient = new KorailClient(cryptoService, stationRegistry, objectMapper);

    @Test
    @DisplayName("1. 서울 -> 부산 (실서버 실시간 열차 조회)")
    void testSearchSeoulToBusan() {
        KorailDto.SearchRequest request = new KorailDto.SearchRequest("서울", "부산", "20260910", "080000", "109");
        KorailDto.SearchResponse response = korailClient.searchSchedules(request);

        assertNotNull(response);
        if (response.isSuccess()) {
            assertTrue(response.getTotalCount() > 0);
            assertNotNull(response.getTrains().get(0).getTrainNo());
            assertNotNull(response.getTrains().get(0).getDepartureTime());
        }
    }

    @Test
    @DisplayName("2. 용산 -> 목포 (실서버 실시간 열차 조회)")
    void testSearchYongsanToMokpo() {
        KorailDto.SearchRequest request = new KorailDto.SearchRequest("용산", "목포", "20260910", "080000", "109");
        KorailDto.SearchResponse response = korailClient.searchSchedules(request);

        assertNotNull(response);
        if (response.isSuccess()) {
            assertTrue(response.getTotalCount() > 0);
            assertNotNull(response.getTrains().get(0).getTrainNo());
        }
    }
}
