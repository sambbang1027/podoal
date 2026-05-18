# 🍇 포도알 파이터 (Podobal Fighter)

> 멜론티켓의 실제 예매 프로세스를 시뮬레이션하여 유저의 피지컬과 타이밍을 훈련시키는 실전형 티켓팅 트레이너 Web App

![Tech Stack](https://img.shields.io/badge/React-18-61dafb?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) ![Zustand](https://img.shields.io/badge/Zustand-5-orange)

---

## 소개

콘서트 티켓팅을 앞두고 손가락 피지컬이 걱정되시나요?  
**포도알 파이터**는 멜론티켓의 실제 예매 플로우를 그대로 재현한 훈련 시뮬레이터입니다.

정각 클릭 타이밍, 날짜/회차 연속 클릭, 대기열 인내, 보안문자 타이핑, 이선좌 모달 대응까지 — 실전 그대로 훈련하고 내 피지컬 등급을 확인하세요.

---

## 주요 기능

| 스테이지 | 설명 |
|----------|------|
| ⚙️ **SETTING** | 콘서트명 입력 + 예상 대기 인원 설정 (소규모 / 중대규모 / 지옥문 / 직접 입력) |
| ⏱️ **READY** | 밀리초 서버 시계 주시 → 정각에 초록 버튼 클릭. 날짜/회차 선택까지 한 화면에서 처리 |
| 🎟️ **QUEUE** | 설정 인원 기반 대기 번호 부여 → 실시간 감소하는 대기열 대기. 원하면 바로 입장도 가능 |
| 🔐 **CAPTCHA** | 안심예매 6자리 대문자 보안문자를 5초 안에 입력 |
| 🍇 **SEAT** | 20×20 그리드 400석에서 봇들과 경쟁하며 포도알 선점. 이선좌 모달 대응 훈련 |
| 📊 **RESULT** | 스테이지별 기록 분석 + 피지컬 등급 + 역대 탑 3 + 개인화 피드백 |

---

## 게임 메커니즘

### 난이도 시스템
설정한 **예상 대기 인원(maxQueueSize)** 이 모든 스테이지의 난이도를 결정합니다.

| 프리셋 | 대기 인원 | 봇 수 | 봇 속도 | 이선좌 확률 |
|--------|----------|-------|---------|------------|
| 소규모 | 2,000명 | 3개 | 400~800ms | 15% |
| 중대규모 | 30,000명 | 8개 | 200~500ms | 30% |
| 지옥문 🔥 | 100,000명 | 20개 | 50~200ms | 45% |

### 등급 기준

| 등급 | 칭호 | 조건 |
|------|------|------|
| 🏆 **S** | 신의 손 | 반응 < 300ms · 선택 < 5초 · 캡차 < 3초 |
| ⚡ **A** | 광클 장인 | 반응 < 800ms · 선택 < 10초 · 캡차 < 5초 |
| 🖐️ **B** | 평범한 손가락 | 선택 < 20초 · 캡차 < 10초 |
| 🙏 **F** | 취소표나 노려라 | 나머지 |

### 패널티 시스템
- **F5 / Ctrl+R**: READY · QUEUE 구간에서 흰 화면 오버레이 1.8초 (실제 새로고침 없음)
- **QUEUE F5 패널티**: 대기자 `maxQueueSize × 30%` 추가
- **캡차 5초 초과**: 좌석 선점 취소 → 실패 처리

---

## 시작하기

```bash
# 저장소 클론
git clone https://github.com/your-username/podo-r-fighter.git
cd podo-r-fighter

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

```bash
# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 기술 스택

- **빌드**: Vite 5
- **UI**: React 18 + TypeScript
- **스타일링**: Tailwind CSS v3
- **라우팅**: React Router DOM v6 (createBrowserRouter)
- **상태 관리**: Zustand v5
- **데이터 저장**: LocalStorage (백엔드 없음)

---

## 프로젝트 구조

```
src/
├── pages/
│   ├── Setting.tsx     # 난이도 설정
│   ├── Ready.tsx       # 정각 타임어택 + 날짜/회차 선택
│   ├── Queue.tsx       # 가상 대기열
│   ├── Captcha.tsx     # 보안문자 입력
│   ├── Seat.tsx        # 좌석 선택 (포도알 전쟁터)
│   └── Result.tsx      # 결과 대시보드
├── components/
│   ├── Layout.tsx      # 상단 진행 바 + 레이아웃 셸
│   └── F5Overlay.tsx   # F5 패널티 오버레이
├── store/
│   └── useGameStore.ts # Zustand 전역 스토어
├── utils/
│   └── storage.ts      # LocalStorage 유틸
└── types/
    └── index.ts        # 전역 타입 정의
```

---

## 주의사항

- **PC 전용** — 실제 티켓팅 환경 고증을 위해 모바일 최적화 없음
- 실제 멜론티켓 API와 무관한 순수 시뮬레이션입니다
- 기록은 브라우저 LocalStorage에 저장됩니다 (최대 50회)

---

## 문서

| 파일 | 내용 |
|------|------|
| [`docs/PRD.md`](docs/PRD.md) | 제품 요구사항 정의서 |
| [`docs/WORK.md`](docs/WORK.md) | 진행 중 작업 및 결정 사항 |
| [`docs/HISTORY.md`](docs/HISTORY.md) | 완료된 작업 이력 |
