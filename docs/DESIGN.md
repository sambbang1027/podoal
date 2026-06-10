# 🍇 포도알 파이터 디자인 리뉴얼 가이드

---

## 🎯 디자인 방향

**컨셉:** "진지한 훈련 앱"이 아니라 **"유쾌하지만 긴장감 있는 게임"**
티켓팅 고증은 유지하되, 포도알 파이터만의 브랜드 아이덴티티를 가진 라이트 테마로 전환.
나중에 멜론 모드, 인터파크 모드 등 플랫폼별 모드가 추가돼도 어색하지 않은 구조.

---

## 🎨 컬러 토큰

```css
/* globals.css 또는 tailwind.config.js에 정의 */

--color-bg: #F8F7FF;          /* 전체 배경 — 순백보다 살짝 보라빛 도는 아이보리 */
--color-surface: #FFFFFF;     /* 카드, 패널 배경 */
--color-surface-sub: #F0EEF9; /* 보조 카드, 인풋 배경 */

--color-primary: #7C3AED;     /* 포도 보라 — 메인 액션 버튼, 강조 */
--color-primary-light: #EDE9FE; /* 보라 연하게 — 호버, 뱃지 배경 */
--color-primary-dark: #5B21B6;  /* 보라 진하게 — 버튼 hover/active */

--color-accent: #A855F7;      /* 포인트 퍼플 — 타이머, 숫자 강조 */
--color-danger: #EF4444;      /* 경고, 이선좌 폭탄, 시간 초과 */
--color-success: #10B981;     /* 성공, 완료 상태 */
--color-warning: #F59E0B;     /* 주의, 선택 중 좌석 */

--color-text-primary: #1C1B22;   /* 본문 텍스트 */
--color-text-secondary: #6B7280; /* 보조 텍스트, 레이블 */
--color-text-muted: #9CA3AF;     /* 비활성, placeholder */

--color-border: #E5E1F8;      /* 카드 테두리 — 보라빛 도는 회색 */
--color-border-strong: #C4B8F0; /* 강조 테두리 */
```

---

## ✍️ 타이포그래피

```css
/* 폰트 */
--font-display: 'Bebas Neue', sans-serif;  /* PODOAL FIGHTER 헤더 — 임팩트 있는 영문 */
--font-body: 'Pretendard', sans-serif;      /* 한글 본문 전체 */
--font-mono: 'JetBrains Mono', monospace;  /* 타이머, 숫자 카운터 */

/* 자간 — 지금 가장 큰 문제! */
/* 모든 한글 텍스트에 letter-spacing: -0.02em 기본 적용 */
/* Tailwind: tracking-tight */

/* 스케일 */
--text-xs: 11px;
--text-sm: 13px;
--text-base: 15px;
--text-lg: 18px;
--text-xl: 22px;
--text-2xl: 28px;
--text-display: 48px; /* PODOAL FIGHTER 타이틀 */
```

**Tailwind 클래스로 바꾸는 법:**
```
기존: className="text-4xl font-bold"
변경: className="text-4xl font-bold tracking-tight"  ← 한글 자간 해결
```

---

## 📐 레이아웃 원칙

### 공통
```
- 모든 페이지: min-h-screen bg-[#F8F7FF]
- 콘텐츠 최대 너비: max-w-2xl mx-auto
- 좌우 패딩: px-6
- 카드: bg-white rounded-2xl border border-[#E5E1F8] shadow-sm
```

### 네브바
```
기존: 다크 배경에 흰 텍스트
변경: bg-white border-b border-[#E5E1F8]
      로고 텍스트: text-[#7C3AED] font-bold
      스테이지 표시: text-[#6B7280] text-sm
      진행 바: bg-[#7C3AED] (완료) / bg-[#E5E1F8] (미완료)
```

---

## 🖥️ 화면별 수정 포인트

### SETTING 화면 (메인)
```
현재 문제: 배경이 검정, 카드 없이 요소들이 떠있는 느낌

수정:
- 배경: #F8F7FF
- 타이틀 영역: 포도 이모지 크게 + "PODOAL FIGHTER" Bebas Neue
- 난이도 버튼 3개:
    비선택: bg-white border-2 border-[#E5E1F8] text-[#1C1B22]
    선택됨: bg-[#7C3AED] border-[#7C3AED] text-white
    hover: border-[#7C3AED] text-[#7C3AED]
- 훈련 시작 버튼: bg-[#7C3AED] hover:bg-[#5B21B6] text-white rounded-xl h-14
```

### READY 화면
```
현재 문제: 카드가 왼쪽 치우침, 오른쪽 공백 큼, 배경 허전함

수정:
- 콘서트 정보 카드: 가로 꽉 차게 (max-w-2xl)
- 레이아웃: 썸네일(정사각) + 오른쪽 정보 2컬럼 유지하되 카드 패딩 넉넉하게
- 서버 시계: font-mono text-4xl text-[#7C3AED] — 타이머가 메인이 되도록
- 시작 버튼 (10초 전 등): outline 버튼 스타일
    border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white
```

### QUEUE 화면
```
현재 문제: 대기자 숫자 카드만 덩그러니, 위아래 공백 큼

수정:
- 대기자 숫자: font-mono text-6xl font-bold text-[#1C1B22]
- 카드에 상단 보라 accent 바 추가: border-t-4 border-[#7C3AED]
- 프로그레스 바: bg-[#7C3AED]
- F5 경고 문구: text-[#EF4444] text-sm — 더 눈에 띄게
- 빈 공간 활용: 대기 중 팁 문구 or 포도 로딩 애니메이션 추가
```

### SEAT 화면
```
현재 문제: 그리드가 너무 꽉 참, 상단 정보가 너무 작음

수정:
- 상단 정보바: 잔여석 숫자를 크게, 카드 형태로
- 좌석 그리드:
    선택 가능: bg-[#7C3AED] hover:bg-[#5B21B6] hover:text-white rounded-sm
    선점됨: bg-[#9CA3AF]
    선택 중: bg-[#F59E0B]
- 범례: 하단 고정 → 상단 카드 안으로 이동
- 그리드 셀 gap: gap-0.5 → gap-1 (숨통 트이게)
```

### CAPTCHA 화면
```
현재 문제: 전체적으로 좋은데 배경만 바꾸면 됨

수정:
- 배경: #F8F7FF
- 보안문자 표시 박스: bg-[#F0EEF9] border-2 border-[#C4B8F0]
- 보안문자 텍스트: text-[#7C3AED] font-mono font-bold
- 타이머 바: bg-[#7C3AED] → 시간 줄수록 bg-[#EF4444]로 색상 변화
- 입력 필드: border-2 border-[#7C3AED] focus:ring-2 focus:ring-[#A855F7]
```

### RESULT 화면
```
현재 문제: 전체적으로 괜찮은 구조, 배경 + 컬러만 교체

수정:
- 랭크 텍스트: text-[#7C3AED] (현재 파란색 → 보라로 통일)
- 스테이지별 기록 카드: bg-white border border-[#E5E1F8]
- 수치 컬러:
    좋음: text-[#10B981]
    보통: text-[#F59E0B]
    나쁨: text-[#EF4444]
- AI 피드백 카드: bg-[#F0EEF9] border-l-4 border-[#7C3AED]
- 다시 훈련하기 버튼: bg-[#7C3AED]
```

---

## ⚡ 우선순위 작업 순서

```
1순위 (반나절) — 임팩트 크고 빠른 것
  □ globals.css / tailwind.config 컬러 토큰 교체
  □ 전체 bg-black → bg-[#F8F7FF], text-white → text-[#1C1B22]
  □ 한글 전체에 tracking-tight 적용

2순위 (하루) — 화면별 카드 정리
  □ SETTING 난이도 버튼 스타일
  □ READY 레이아웃 2컬럼 정리
  □ QUEUE 빈 공간 처리

3순위 (여유 있을 때)
  □ SEAT 그리드 컬러 교체
  □ CAPTCHA 타이머 색상 변화 효과
  □ 네브바 진행 바 스타일
```

---

## 💡 추가하면 포폴 어필에 좋은 것 (선택)

- **모드 선택 UI** (메인에 "멜론 모드 / 인터파크 모드 준비 중" 뱃지) → 확장성 어필
- **SEAT 화면 이선좌 모달** — 애니메이션 있으면 임팩트 큼
- **RESULT 화면 공유하기 버튼** — 카카오 공유 or 클립보드 복사