# 토닥(TODAK)

마음이 편안해지는 순간을 만드는 상담센터 찾기 웹 프로젝트입니다.

## 프로젝트 소개

이 프로젝트는 상담센터를 쉽게 찾고, 위치를 확인하며, 내 주변 또는 원하는 지역에서 적절한 심리상담 기관을 탐색할 수 있도록 구성한 정적 웹 애플리케이션입니다.

- 메인 랜딩 페이지 구성
- 상담센터 검색 페이지 구성
- 이름/키워드 기반 검색
- 지역 기반 검색
- 내 주변 상담센터 조회
- Kakao Map 기반 지도 표시
- 반응형 UI 디자인

## 주요 기능

### 1. 메인 페이지
- 서비스 소개 및 브랜드 메시지 전달
- 상담센터 찾기 진입 버튼
- 상담사 찾기, 정부바우처 등 서비스 안내 카드

### 2. 상담센터 찾기 페이지
- 상담센터명 또는 주소 검색
- 지역 선택 기반 검색
- 현재 위치 기반 주변 검색
- 검색 결과 목록 및 지도 표시

### 3. 지도 연동
- Kakao Maps JavaScript SDK 사용
- Kakao Local API를 통한 장소 검색
- 검색 결과를 지도 마커와 목록에 함께 표시

## 기술 스택

- HTML5
- CSS3
- JavaScript
- Vite
- Kakao Maps API
- Kakao Local API
- Node.js / Express

## 프로젝트 구조

```text
project/
├── front-end/
│   ├── .env
│   ├── app.js
│   ├── index.html
│   ├── search.html
│   ├── style.css
│   ├── css/
│   ├── icon-img/
│   └── js/
├── back-end/
├── dist/
├── package.json
├── wrangler.jsonc
├── README.md
└── .gitignore
```

## 환경 변수 설정

`front-end/.env` 파일에서 Kakao 및 공공데이터 API 키를 설정합니다.

```env
VITE_KAKAO_JAVASCRIPT_KEY=your_kakao_javascript_key
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key
VITE_PUBLIC_DATA_API_KEY=your_public_data_key
VITE_MOLIT_API_KEY=your_molit_key
```

> 실제 검색 기능을 사용하려면 위 값이 필요합니다.

## 실행 방법

### 1) 의존성 설치

```bash
npm install
```

### 2) 개발 서버 실행

```bash
npm run dev
```

기본적으로 Vite 개발 서버가 실행되며, 브라우저에서 메인 페이지를 확인할 수 있습니다.

### 3) 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `dist` 폴더에 생성됩니다.

## 배포 정보

- Vite 기반 정적 사이트 빌드
- Cloudflare Wrangler 설정 포함
- `wrangler.jsonc`를 통해 배포 환경 구성 가능

## 참고

본 프로젝트는 실제 API 키가 있어야 검색 기능이 정상적으로 동작합니다. 로컬 환경에서 테스트할 경우 `.env` 파일의 값이 올바르게 설정되어 있는지 확인해주세요.

## 라이선스

- ISC
