# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Gradle 캐싱을 위해 래퍼 및 빌드 스크립트 먼저 복사
COPY gradlew ./
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew
# 의존성 사전 캐시
RUN ./gradlew dependencies --no-daemon || true

# 전체 소스 복사 및 애플리케이션 JAR 패키징
COPY src/ src/
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# 코레일 모바일 스텔스 브릿지용 Python 3 및 필수 모듈 설치
RUN apk add --no-cache python3 py3-pip py3-requests py3-cryptography tzdata && \
    ln -sf /usr/bin/python3 /usr/bin/python

# 타임존 설정 (Asia/Seoul)
ENV TZ=Asia/Seoul
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 백엔드 실행 JAR 복사
COPY --from=builder /workspace/build/libs/*.jar app.jar

# 코레일 스텔스 통신 브릿지 스크립트 복사
COPY src/main/resources/korail_bridge.py /app/korail_bridge.py
COPY src/main/resources/dynapath.py /app/dynapath.py
COPY src/main/resources/constants.py /app/constants.py

# 기본 운영 프로파일 지정
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 18080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-XX:+UseG1GC", "-jar", "app.jar"]
