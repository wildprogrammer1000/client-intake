# Client Intake Monorepo

`frontend`(React + TypeScript + MUI)와 `backend`(Node.js + Express + TypeScript + Prisma + PostgreSQL)를 하나의 저장소에서 관리하는 모노레포입니다.

## 폴더 구조

- `frontend`: 랜딩페이지 프론트엔드
- `backend`: API 서버
- `docker-compose.dev.yml`: 개발용(DB만 컨테이너)
- `docker-compose.yml`: 프로덕션용(프론트/백엔드/DB 전체 컨테이너)

## 개발 환경 실행

개발 환경에서는 데이터베이스만 Docker로 실행하고, 프론트엔드와 백엔드는 npm으로 직접 실행합니다.

1) 데이터베이스 실행

```bash
docker compose -f docker-compose.dev.yml up -d
```

2) 백엔드 환경 변수 설정

```bash
cp backend/.env.example backend/.env
```

3) 프론트엔드 실행 (터미널 1)

```bash
npm run dev:frontend
```

4) 백엔드 실행 (터미널 2)

```bash
npm run dev:backend
```

백엔드 헬스체크: `http://localhost:4000/health`

## Prisma 사용

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend -- --name init
npm run prisma:seed --workspace backend
```

## 문의 접수 API

- `POST /api/inquiries`
  - 외주 문의 폼 데이터를 DB에 저장합니다.
  - `projectType` 값: `WEBSITE | MOBILE_APP | ADMIN_SYSTEM | SHOPPING_MALL | OTHER`
- `POST /api/uploads/presigned-url`
  - S3 업로드용 presigned URL을 발급합니다.
  - 프론트엔드는 발급된 `uploadUrl`로 파일을 업로드하고, `fileUrl`을 문의 payload의 `attachmentUrls`로 전달합니다.

## 첨부파일 업로드(S3/CloudFront)

`backend/.env`에 아래 값을 설정하세요.

```bash
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your-s3-bucket-name
AWS_S3_PREFIX=inquiries
AWS_CLOUDFRONT_URL=https://your-cloudfront-domain
```

주의사항:
- S3 버킷 CORS에서 프론트 도메인 `PUT` 허용이 필요합니다.
- 민감 파일 업로드가 필요하면 파일 확장자/용량 검증과 안티바이러스 스캔(비동기)을 추가하세요.

## 관리자 인증/조회

- 로그인: `POST /api/admin/auth/login`
- 인증 상태 확인: `GET /api/admin/auth/me`
- 비밀번호 변경(인증 필요): `PATCH /api/admin/auth/password`
- 문의 목록 조회(인증 필요): `GET /api/admin/inquiries`
- 문의 상세 조회(인증 필요): `GET /api/admin/inquiries/:id`

관리자 페이지 URL:
- `http://localhost:5173/admin`

초기 관리자 계정은 시드로 생성됩니다.
- 환경변수: `ADMIN_INITIAL_USER_ID`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_INITIAL_NAME`
- 기본 아이디: `admin`
- 실행: `npm run prisma:seed --workspace backend`

## 프로덕션 환경 실행 (Docker Compose)

```bash
docker compose up --build -d
```

- 프론트엔드: `http://localhost:5173`
- 백엔드: `http://localhost:4000`

## 워크스페이스 스크립트

```bash
npm run build:frontend
npm run build:backend
npm run build
```
