package com.trend.backend.domain.korail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 코레일 모바일 공식 프로토콜 비밀번호 암호화 서비스
 * - AES-128-CBC PKCS5Padding
 * - code.do 에서 동적으로 발급받은 대칭키 및 IV 사용
 * - 이중 Base64 (Double Base64) 인코딩 적용
 */
@Slf4j
@Service
public class KorailCryptoService {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";

    public String encryptPassword(String password, String key) {
        if (password == null || key == null || key.length() < 16) {
            throw new IllegalArgumentException("유효하지 않은 비밀번호 또는 암호화 키입니다.");
        }

        try {
            byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
            byte[] ivBytes = key.substring(0, 16).getBytes(StandardCharsets.UTF_8);

            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");
            IvParameterSpec iv = new IvParameterSpec(ivBytes);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, iv);

            byte[] encryptedBytes = cipher.doFinal(password.getBytes(StandardCharsets.UTF_8));

            // 1차 Base64 인코딩
            byte[] firstBase64Bytes = Base64.getEncoder().encode(encryptedBytes);
            // 2차 Base64 인코딩 (Double Base64)
            String doubleBase64 = Base64.getEncoder().encodeToString(firstBase64Bytes);

            log.debug("코레일 비밀번호 암호화 완료 (길이: {})", doubleBase64.length());
            return doubleBase64;
        } catch (Exception e) {
            log.error("코레일 비밀번호 암호화 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("비밀번호 암호화 실패: " + e.getMessage(), e);
        }
    }
}
