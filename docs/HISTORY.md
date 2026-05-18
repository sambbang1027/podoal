# HISTORY.md — 완료된 작업 이력

> 작업 완료 시 즉시 기록. 형식: 날짜 / 작업 제목 / 주요 변경 파일

---

## 2026-05-16

### PRD 작성 완료
- **파일**: `docs/PRD.md`
- **내용**: 포도알 파이터 전체 기획 확정
  - 전역 아키텍처 (Zustand 스토어 타입, 라우팅 구조, F5 패널티 범위)
  - 스테이지별 상세 스펙 7단계 (SETTING → READY → POPUP → QUEUE → SEAT → CAPTCHA → RESULT)
  - 대기 순번 계산 공식, 봇 시뮬레이션 수치, 이선좌 확률, 등급 산정 로직
  - LocalStorage 스키마 정의
  - Day 1 / Day 2 개발 마일스톤

### WORK.md / HISTORY.md 문서 구조 세팅 완료
- **파일**: `docs/WORK.md`, `docs/HISTORY.md`
- **내용**: 작업 관리 체계 수립 (진행 예정 / 결정 사항 / 완료 이력)

### 전체 페이지 MVP 구현 완료
- **변경 파일**: `src/` 전체
- **구현 내용**:
  - Vite + React + TypeScript + Tailwind CSS + Zustand 프로젝트 세팅
  - Zustand 스토어 + 전역 타입 정의 (`src/store/useGameStore.ts`, `src/types/index.ts`)
  - React Router 라우팅 + 레이아웃 셸 + 진행 바 (`src/components/Layout.tsx`)
  - F5 패널티 오버레이 컴포넌트 (`src/components/F5Overlay.tsx`)
  - LocalStorage 유틸 (`src/utils/storage.ts`)
  - SETTING 페이지 — 난이도 프리셋 + 직접 입력
  - READY 페이지 — 밀리초 서버 시계 + 카운트다운 셀렉터 + 정각 클릭
  - POPUP 페이지 — 날짜/회차/다음단계 3콤보 스피드런
  - QUEUE 페이지 — 불규칙 대기열 감소 + F5 패널티 + 수동 이동 버튼
  - CAPTCHA 페이지 — 6자리 대문자 보안문자 + 5초 타이머
  - SEAT 페이지 — 20×20 그리드 + 봇 시뮬레이션 + 이선좌 모달
  - RESULT 페이지 — 등급/칭호 + 스테이지별 기록 + 피드백 + 탑 3
- **확정 플로우**: SETTING → READY → POPUP → QUEUE → CAPTCHA → SEAT → RESULT
- **주요 결정 변경**: CAPTCHA를 SEAT 이전으로 순서 변경 (유저 요청)
- **QUEUE 개선**: 자동 대기 전부 기다리지 않고 수동으로 넘어가는 버튼 추가 (유저 요청)
