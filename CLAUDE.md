# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 지침을 제공합니다.

---

## CLAUDE.md 계층 구조 원칙

이 파일은 **이 프로젝트에 특화된 내용만** 기술한다.
범용 원칙(워크플로우, 네이밍 컨벤션, 브랜치 전략 등)은 `~/.claude/CLAUDE.md`(전역)에 작성하고
이 파일에는 중복 기술하지 않는다.

---

# 포도알 파이터 (Podobal Fighter)

멜론티켓 실전형 티켓팅 트레이너 Web App. 상세 내용은 [`docs/PRD.md`](./docs/PRD.md) 참조.

## Project Overview

멜론티켓의 실제 예매 프로세스(정각 클릭 → 날짜/회차 선택 → 대기열 → 좌석 선택 → 보안문자)를
7단계 스테이지로 시뮬레이션하여 유저의 피지컬과 타이밍을 훈련시키는 PC 전용 게임 웹앱.

## Out of Scope

→ [`docs/PRD.md` — Section 6. 개발 범위 제한](./docs/PRD.md) 참조.

요약: 백엔드/DB/회원가입, 모바일 반응형, 사운드 효과, 복합 좌석 구역 선택, 실제 멜론 API 연동 없음.

## Commands

```bash
# 의존성 설치 (클론 후)
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린트
npm run lint
```

## Tech Stack

- **빌드 도구**: Vite
- **UI 프레임워크**: React 18
- **스타일링**: Tailwind CSS v3
- **라우팅**: React Router DOM v6 (`createBrowserRouter` Data API 방식)
- **전역 상태**: Zustand (경량 스토어 단일 파일)
- **언어**: TypeScript (TSX)
- **데이터 영속성**: LocalStorage (백엔드 없음)
- **아키텍처**: 스테이지 기반 SPA — 각 예매 단계가 독립 페이지(pages)로 분리되고, 단계 간 데이터는 Zustand 전역 스토어로 전달

```
src/
├── pages/           # 스테이지별 페이지 (Setting, Ready, Popup, Queue, Seat, Captcha, Result)
├── components/      # 재사용 공통 컴포넌트 (F5Overlay, Modal, CountdownClock 등)
├── store/
│   └── useGameStore.ts   # Zustand 전역 스토어 (단일 파일)
├── utils/
│   └── storage.ts        # LocalStorage 읽기/쓰기 유틸
└── main.tsx         # 앱 진입점
```

## Code Style

> 네이밍, 컴포넌트 원칙, 브랜치 전략은 `~/.claude/CLAUDE.md`(전역) 참조.

### 이 프로젝트 특화 규칙

- **상태**: Zustand 단일 스토어 (`src/store/useGameStore.ts`). 로컬 상태는 `useState`, 스테이지 간 공유 데이터만 스토어에 올린다.
- **스타일링**: Tailwind CSS 유틸리티 클래스만 사용. 별도 CSS 파일 작성하지 않는다.
- **타이머**: `setInterval` / `setTimeout` 사용 후 반드시 컴포넌트 언마운트 시 `clearInterval` / `clearTimeout` 처리.
- **F5 패널티**: 실제 새로고침이 아닌 오버레이 시뮬레이션. `keydown` → `preventDefault()` → 흰 화면 오버레이 1.8초. READY / POPUP / QUEUE 구간에서만 활성화.
- **난이도 기준값**: `maxQueueSize`가 모든 스테이지의 봇 속도, 이선좌 확률, 대기열 규모를 결정하는 단일 기준값임.

## Development Notes

### 스테이지 플로우

```
/ (SETTING) → /ready → /popup → /queue → /captcha → /seat → /result
```

### 난이도별 핵심 수치

| 항목 | 소규모 (2,000) | 중대규모 (30,000) | 지옥문 (100,000) |
|------|--------------|-----------------|----------------|
| 봇 수 | 3개 | 8개 | 20개 |
| 봇 삭제 간격 | 400~800ms | 200~500ms | 50~200ms |
| 이선좌 확률 | 15% | 30% | 45% |
| F5 패널티 | maxQueueSize × 0.3 추가 | 동일 | 동일 |

### 개발 현황

| 항목 | 상태 |
|------|------|
| 프로젝트 초기 세팅 (Vite + React + Tailwind + Zustand) | ✅ 완료 |
| Zustand 스토어 + 타입 정의 | ✅ 완료 |
| React Router 라우팅 + 레이아웃 셸 | ✅ 완료 |
| F5 패널티 글로벌 이벤트 바인딩 | ✅ 완료 |
| SETTING 페이지 | ✅ 완료 |
| READY 페이지 | ✅ 완료 |
| POPUP 페이지 | ✅ 완료 |
| QUEUE 페이지 | ✅ 완료 |
| CAPTCHA 페이지 | ✅ 완료 |
| SEAT 페이지 | ✅ 완료 |
| RESULT 페이지 | ✅ 완료 |
| LocalStorage 연동 | ✅ 완료 |
| 전체 플로우 E2E 테스트 + 버그 수정 | ⬜ 미완료 |
| UI 폴리싱 | ⬜ 미완료 |

## 문서 파일 역할

| 파일 | 역할 |
|------|------|
| `docs/PRD.md` | 제품 요구사항 정의서 — 기능 명세, 로직 공식, Out of Scope |
| `docs/WORK.md` | 현재 작업 현황 및 앞으로 할 일, 기술 결정 사항 |
| `docs/HISTORY.md` | 완료된 작업 기록 |

## 작업 조회 규칙

- **"다음 작업은?"** 또는 **"앞으로 할 작업은?"** 이라고 물으면
  → `docs/WORK.md`를 먼저 읽고 답한다.
- **"이전에 한 작업은?"** 또는 **"완료한 작업은?"** 이라고 물으면
  → `docs/HISTORY.md`를 참고하라고 안내한다.
