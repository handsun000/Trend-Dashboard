package com.trend.backend.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public-data")
@RequiredArgsConstructor
public class PublicDataController {

    private final PublicDataService publicDataService;

    @GetMapping("/summary")
    public ResponseEntity<PublicDataDto.SummaryResponse> getSummary() {
        return ResponseEntity.ok(publicDataService.getSummary());
    }

    @GetMapping("/series")
    public ResponseEntity<List<Map<String, Object>>> getSeries(@RequestParam(defaultValue = "REAL_ESTATE") String category) {
        if ("MACRO".equalsIgnoreCase(category)) {
            return ResponseEntity.ok(publicDataService.getMacroSeries());
        } else if ("WEATHER_CONSUMPTION".equalsIgnoreCase(category) || "WEATHER".equalsIgnoreCase(category)) {
            return ResponseEntity.ok(publicDataService.getWeatherConsumptionSeries());
        } else {
            return ResponseEntity.ok(publicDataService.getRealEstateSeries());
        }
    }

    @GetMapping("/regions/hierarchy")
    public ResponseEntity<List<RegionalCodeRegistry.SidoHierarchy>> getRegionHierarchy() {
        return ResponseEntity.ok(publicDataService.getRegionHierarchy());
    }

    @GetMapping("/regions/search")
    public ResponseEntity<List<RegionalCodeRegistry.RegionInfo>> searchRegions(@RequestParam(value = "q", required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(publicDataService.searchRegions(query));
    }

    @GetMapping("/real-estate/paged")
    public ResponseEntity<PublicDataDto.PagedRealEstateResponse> getPagedRealEstateTransactions(
            @RequestParam(value = "district", required = false, defaultValue = "ALL") String district,
            @RequestParam(value = "lawdCd", required = false) String lawdCd,
            @RequestParam(value = "tradeType", required = false, defaultValue = "ALL") String tradeType,
            @RequestParam(value = "propertyType", required = false, defaultValue = "ALL") String propertyType,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size
    ) {
        String targetDistrict = (lawdCd != null && !lawdCd.isBlank()) ? lawdCd : district;
        return ResponseEntity.ok(publicDataService.getPagedTransactions(targetDistrict, tradeType, propertyType, page, size));
    }

    @GetMapping("/real-estate/transactions")
    public ResponseEntity<List<PublicDataDto.RealEstateTransaction>> getRealEstateTransactions(
            @RequestParam(value = "district", required = false, defaultValue = "ALL") String district,
            @RequestParam(value = "lawdCd", required = false) String lawdCd,
            @RequestParam(value = "tradeType", required = false, defaultValue = "ALL") String tradeType,
            @RequestParam(value = "propertyType", required = false, defaultValue = "ALL") String propertyType
    ) {
        String targetDistrict = (lawdCd != null && !lawdCd.isBlank()) ? lawdCd : district;
        return ResponseEntity.ok(publicDataService.getRecentTransactions(targetDistrict, tradeType, propertyType));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshPublicData() {
        publicDataService.refreshAll();
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Public data cache refreshed from live OpenAPI."));
    }
}
