package com.trend.backend.domain.korail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class KorailCryptoServiceTest {

    private final KorailCryptoService cryptoService = new KorailCryptoService();

    @Test
    @DisplayName("코레일 모바일 AES-CBC PKCS5 Double Base64 암호화 검증")
    void testEncryptPassword() {
        String testPassword = "mySecretPassword123!";
        String testKey = "12345678901234567890123456789012"; // 32자 키

        String encrypted = cryptoService.encryptPassword(testPassword, testKey);

        assertNotNull(encrypted);
        assertFalse(encrypted.isBlank());

        // 더블 Base64 디코딩 가능 여부 검증
        byte[] firstDecoded = Base64.getDecoder().decode(encrypted);
        assertNotNull(firstDecoded);
        byte[] secondDecoded = Base64.getDecoder().decode(firstDecoded);
        assertNotNull(secondDecoded);
        assertTrue(secondDecoded.length > 0);
        assertEquals(0, secondDecoded.length % 16, "AES 블록 크기(16바이트)의 배수여야 합니다.");
    }
}
