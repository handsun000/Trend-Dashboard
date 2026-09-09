# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# 캐시 효율을 위해 의존성 파일 먼저 복사
COPY package*.json ./
RUN npm ci

# 소스 복사 및 프로덕션 번들 빌드
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine AS runtime

# 빌드 산출물 및 커스텀 nginx 설정 복사
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
