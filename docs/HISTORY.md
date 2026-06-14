# HISTORY.md — 완료된 작업 이력

> 작업 완료 시 즉시 기록. 형식: 날짜 / 작업 제목 / 주요 변경 파일

---

## 2026-06-14

### E2E 전체 플로우 테스트 완료

- **파일**: `e2e_test.mjs` (Playwright)
- **수정 사항**:
  - 실제 라우팅 확인: `/popup` 라우트 없음 → `doPopup` 단계 제거
  - `doReady` 흐름 수정: "10초 전" 클릭 → 10초 카운트다운 → 날짜/시간 선택 → "예매하기"
  - HashRouter URL 패턴 수정: `**/ready` → `**#/ready`
- **테스트 결과**:
  | 테스트 | 결과 | 비고 |
  |--------|------|------|
  | 정상 플로우 (SETTING→RESULT) | ✅ | VIP 이선좌 85% 체감, 실패 정상 |
  | VIP 매진 후 floor2 + 리셋 버그 | ✅ | floor2 상태 유지 확인 (리셋 버그 수정됨) |
  | CAPTCHA 타임아웃 | ✅ | 6.5초 후 RESULT 이동 + 실패 표시 정상 |
  | F5 패널티 (QUEUE) | ⚠️ | QUEUE 유지 ✓, 오버레이 감지 불가 |
- **F5 테스트 한계**: Playwright headless에서 F5는 브라우저 레벨 새로고침으로 처리되어 JS `keydown` 이벤트가 발화되지 않음 → 실제 Chrome에서 수동 확인 필요. 앱 코드 자체 버그 아님.

---

## 2026-06-13

### Zone 봇 타이밍 현실화 + floor2 리셋 버그 수정

- **변경 파일**: `src/utils/zoneConfig.ts`, `src/pages/Zone.tsx`, `src/pages/Seat.tsx`
- **내용**:
  - **floor2 startDelay**: 4000ms → 500ms, floor3: 8000ms → 4000ms → floor2 1500ms (VIP와 거의 동시에 소진 시작)
  - **VIP 매진 시 floor2 러시 봇 투입** (`handleVipSoldOut`) — `startBots('floor2', 6)` 즉시 추가 투입
  - **Zone.tsx `startBots` 리팩터** — `extraCount`, `onSoldOut` 콜백 파라미터 추가
  - **allSoldOut을 `displaySeats` 기반으로 수정** — 기존 `seatsRef` 기반은 리렌더 타이밍 이슈 있었음
  - **floor2 리셋 버그 수정** — 봇 tick마다 `setZoneSeatState` 호출 추가 (Zustand 실시간 동기화)
  - **첫 tick 딜레이 단축**: 600-800ms → 0-80ms (Zone 진입 즉시 소진 시작, 리마운트 시 stale state 방지)
  - **Seat 매진 오버레이 제거** — soldOut 시 즉시 `/zone` 복귀 (1.8초 대기 제거)
- **핵심 버그 원인**: 봇 tick이 Zustand에 상태를 저장하지 않아 유저가 Zone → Seat → Zone 이동 시 floor2가 `[]`(빈 배열)로 복원되어 120으로 리셋되는 현상

---

## 2026-06-12

### Zone/Seat 플로우 완성 + 버그 수정 + VIP 난이도 조정

- **변경 파일**: `src/pages/Zone.tsx`, `src/pages/Seat.tsx`, `src/pages/Captcha.tsx`, `src/store/useGameStore.ts`, `src/utils/zoneConfig.ts`, `src/components/Layout.tsx`
- **내용**:
  - **구역 선택(Zone) 페이지 신설** — CAPTCHA 통과 후 VIP/2층/3층 구역 카드 선택
  - **스태거드 봇 시작** — VIP 즉시, 2층 4초 후, 3층 8초 후 봇 활성화 (Zone 재진입 시 경과 시간 반영)
  - **Seat 페이지 연동** — 선택 구역 기반으로 좌석 그리드/봇 설정 동적 적용
  - **Zone 좌석 상태 유지** — Zustand `zoneSeatStates`로 Seat 이탈 후 복귀 시 상태 보존
  - **QUEUE F5 새로고침 버그 수정** — 실제 새로고침 발생 시 sessionStorage persist로 상태 복원, `beforeunload`에서 패널티 반영 후 저장
  - **totalTime 유닉스 타임스탬프 버그 수정** — `bookingStartTime > 0` 조건 추가
  - **전체 매진 처리** — Zone 모든 구역 소진 시 `finalize(false)` 호출 후 결과 페이지
  - **Seat 초기 매진 처리** — 마운트 시 좌석 0개면 즉시 Zone으로 복귀
  - **VIP 난이도 상향** — `takenProb: 0.5 → 0.85`, `botCount: 8 → 10`, 봇 속도 소폭 상향
- **핵심 설계 결정**: 봇 속도보다 이선좌 확률(takenProb)이 체감 난이도의 핵심

---

## 2026-06-11

### UI 디자인 리뉴얼 완료 (DESIGN.md 기반 라이트 테마 전환)
- **변경 파일**: `src/index.css`, `tailwind.config.ts`, `index.html`, `src/components/Layout.tsx`, `src/pages/` 전체
- **내용**:
  - 전체 테마 다크(`#0a0a0a`) → 라이트(`#F8F7FF`) 전환
  - 폰트 추가: Bebas Neue (타이틀), Pretendard (본문), JetBrains Mono (숫자/타이머)
  - 한글 전체 `letter-spacing: -0.02em` 기본 적용
  - 네브바: 다크 → `bg-white border-b border-[#E5E1F8]`, 로고/진행 바 보라 계열
  - SETTING: Bebas Neue 타이틀, 난이도 버튼 보라 계열, 시작 버튼 `rounded-xl h-14`
  - READY: 콘서트 정보 카드 화이트, 서버 시계 `text-4xl text-[#7C3AED]` 강조
  - POPUP: 모달 카드 화이트, 버튼 보라 계열, 다음단계 버튼 보라
  - QUEUE: 대기 번호 카드 상단 accent 바(`border-t-4 border-[#7C3AED]`), F5 경고 빨강 강조
  - CAPTCHA: 보안문자 박스 `bg-[#F0EEF9]`, 타이머 보라→노랑→빨강 색상 변화
  - SEAT: 선택 가능 `bg-[#7C3AED]`, 선점됨 `bg-[#9CA3AF]`, 범례 상단 카드로 이동
  - RESULT: 피드백 카드 `border-l-4 border-[#7C3AED]`, 수치 성공/실패 컬러, 랭크 보라 통일
- **배포**: gh-pages 배포 완료

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
