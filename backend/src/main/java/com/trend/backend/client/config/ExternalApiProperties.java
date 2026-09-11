package com.trend.backend.client.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ExternalApiProperties {

    @Getter
    @Setter
    @Configuration
    @ConfigurationProperties(prefix = "kis.open-api")
    public static class KisProperties {
        private String appKey = "dummy_app_key";
        private String appSecret = "dummy_app_secret";
        private String domain = "https://openapivts.koreainvestment.com:29443";

        public boolean isConfigured() {
            return appKey != null && !appKey.isBlank() && !"dummy_app_key".equals(appKey);
        }
    }

    @Getter
    @Setter
    @Configuration
    @ConfigurationProperties(prefix = "public-data")
    public static class PublicDataProperties {
        private String serviceKey = "dummy_service_key";

        public boolean isConfigured() {
            return serviceKey != null && !serviceKey.isBlank() && !"dummy_service_key".equals(serviceKey);
        }
    }

    @Getter
    @Setter
    @Configuration
    @ConfigurationProperties(prefix = "gemini")
    public static class GeminiProperties {
        private String apiKey = "";

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("dummy");
        }
    }

    @Getter
    @Setter
    @Configuration
    @ConfigurationProperties(prefix = "korail")
    public static class KorailProperties {
        private String memberNo = "";
        private String password = "";
        private String phoneNo = "";

        public boolean isConfigured() {
            return memberNo != null && !memberNo.isBlank() && password != null && !password.isBlank();
        }
    }

    @Getter
    @Setter
    @Configuration
    @ConfigurationProperties(prefix = "upbit.api")
    public static class UpbitProperties {
        private String baseUrl = "https://api.upbit.com";

        public boolean isConfigured() {
            return true; // 공개 API (Open API)
        }
    }

    @Getter
    @Setter
    @Configuration
    @ConfigurationProperties(prefix = "telegram")
    public static class TelegramProperties {
        private String botToken = "";
        private String chatId = "";
        private boolean enabled = true;

        public boolean isConfigured() {
            return enabled && botToken != null && !botToken.isBlank() && chatId != null && !chatId.isBlank();
        }
    }
}

