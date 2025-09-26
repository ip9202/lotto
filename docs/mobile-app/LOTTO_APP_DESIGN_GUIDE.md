# 🎨 LottoAI 모바일 앱 디자인 가이드

## 📋 문서 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | LottoAI 모바일 앱 |
| **디자인 트렌드** | 2025년 모던·그레이 중심 UI |
| **작성일** | 2025-09-26 (KST) |
| **현재 시간** | 2025-09-26 10:23 KST |
| **기준 문서** | 2025년 모던·그레이 중심 UI 사례 모아줘.md |

---

## 🎯 디자인 철학

### **A. 핵심 원칙**
- **미니멀리즘**: 불필요한 요소 제거, 콘텐츠에 집중
- **그레이 중심**: 중성적이고 고급스러운 느낌
- **로또 번호 색상 유지**: 사용자 인식에 중요한 색상 보존
- **접근성**: 모든 사용자가 쉽게 사용할 수 있는 디자인
- **일관성**: 전체 앱에서 통일된 디자인 언어

### **B. 브랜드 아이덴티티**
- **주요 컬러**: 보라색 (#6C5CE7) - AI와 신뢰성 표현
- **보조 컬러**: 그레이 스케일 - 미니멀하고 세련된 느낌
- **포인트 컬러**: 로또 번호별 고유 색상 - 직관적 인식
- **타이포그래피**: 명확하고 읽기 쉬운 폰트

---

## 🎨 컬러 팔레트

### **A. 메인 컬러**

#### **1. 브랜드 컬러**
```css
/* Primary Colors */
--primary-purple: #6C5CE7;        /* 메인 브랜드 컬러 */
--primary-purple-light: #A29BFE;  /* 연한 보라 */
--primary-purple-dark: #5F3DC4;   /* 진한 보라 */

/* Secondary Colors */
--secondary-gray: #74B9FF;         /* 보조 컬러 (파랑) */
--accent-green: #00B894;           /* 성공/당첨 컬러 */
--accent-orange: #FDCB6E;          /* 경고/주의 컬러 */
```

#### **2. 그레이 스케일**
```css
/* Gray Scale */
--gray-50: #F8F9FA;               /* 가장 밝은 그레이 (배경) */
--gray-100: #E9ECEF;              /* 연한 그레이 (경계선) */
--gray-200: #DEE2E6;              /* 중간 연한 그레이 */
--gray-300: #CED4DA;              /* 중간 그레이 */
--gray-400: #ADB5BD;              /* 중간 진한 그레이 */
--gray-500: #6C757D;              /* 중성 그레이 */
--gray-600: #495057;              /* 진한 그레이 */
--gray-700: #343A40;              /* 더 진한 그레이 */
--gray-800: #212529;              /* 매우 진한 그레이 */
--gray-900: #1A1A1A;              /* 가장 진한 그레이 (다크 모드 배경) */
```

#### **3. 로또 번호 컬러 (기존 유지)**
```css
/* Lotto Number Colors */
--lotto-red: #FF6B6B;             /* 1-10번 (빨강) */
--lotto-blue: #4ECDC4;            /* 11-20번 (파랑) */
--lotto-sky: #45B7D1;             /* 21-30번 (하늘색) */
--lotto-green: #96CEB4;           /* 31-40번 (초록) */
--lotto-yellow: #FFEAA7;          /* 41-45번 (노랑) */
--lotto-bonus: #DDA0DD;           /* 보너스 번호 (보라) */
```

### **B. 다크 모드 컬러**

#### **1. 다크 모드 팔레트**
```css
/* Dark Mode Colors */
--dark-background: #1A1A1A;       /* 다크 모드 배경 */
--dark-surface: #2D2D2D;          /* 다크 모드 카드 배경 */
--dark-surface-elevated: #3A3A3A; /* 다크 모드 상승된 카드 */
--dark-text-primary: #FFFFFF;     /* 다크 모드 주요 텍스트 */
--dark-text-secondary: #B0B0B0;   /* 다크 모드 보조 텍스트 */
--dark-border: #404040;           /* 다크 모드 경계선 */
```

---

## 📝 타이포그래피

### **A. 폰트 패밀리**
```css
/* Font Families */
--font-primary: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-secondary: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
```

### **B. 폰트 크기 및 가중치**

#### **1. 헤딩 스타일**
```css
/* Heading Styles */
--heading-1: {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--gray-800);
}

--heading-2: {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--gray-800);
}

--heading-3: {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--gray-800);
}

--heading-4: {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--gray-700);
}
```

#### **2. 본문 텍스트**
```css
/* Body Text Styles */
--body-large: {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--gray-700);
}

--body-medium: {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--gray-600);
}

--body-small: {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--gray-500);
}

--caption: {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--gray-400);
}
```

---

## 🧩 컴포넌트 디자인

### **A. 카드 컴포넌트**

#### **1. 기본 카드**
```css
/* Basic Card */
.card {
  background-color: var(--gray-50);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--gray-100);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
```

#### **2. 추천 번호 카드**
```css
/* Recommendation Card */
.recommendation-card {
  background-color: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(108, 92, 231, 0.1);
  border: 2px solid var(--primary-purple-light);
  position: relative;
  overflow: hidden;
}

.recommendation-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-purple), var(--primary-purple-light));
}
```

### **B. 버튼 컴포넌트**

#### **1. Primary 버튼**
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, var(--primary-purple), var(--primary-purple-light));
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 92, 231, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(108, 92, 231, 0.3);
}
```

#### **2. Secondary 버튼**
```css
/* Secondary Button */
.btn-secondary {
  background-color: #FFFFFF;
  color: var(--primary-purple);
  border: 2px solid var(--primary-purple);
  border-radius: 12px;
  padding: 14px 30px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--primary-purple);
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.2);
}
```

### **C. 로또 번호 볼**

#### **1. 번호별 색상 적용**
```css
/* Lotto Number Balls */
.lotto-ball {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.lotto-ball:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

/* Number Range Colors */
.lotto-ball.range-1-10 { background-color: var(--lotto-red); }
.lotto-ball.range-11-20 { background-color: var(--lotto-blue); }
.lotto-ball.range-21-30 { background-color: var(--lotto-sky); }
.lotto-ball.range-31-40 { background-color: var(--lotto-green); }
.lotto-ball.range-41-45 { background-color: var(--lotto-yellow); }
.lotto-ball.bonus { background-color: var(--lotto-bonus); }
```

---

## 📱 화면별 디자인 가이드

### **A. 메인 화면**

#### **1. 레이아웃 구조**
```
┌─────────────────────────────────┐
│ Header (로고 + 프로필)            │
├─────────────────────────────────┤
│ Quick Actions (추천 버튼)        │
├─────────────────────────────────┤
│ Recent Recommendations          │
│ ┌─────────┐ ┌─────────┐        │
│ │ Card 1  │ │ Card 2  │        │
│ └─────────┘ └─────────┘        │
├─────────────────────────────────┤
│ Statistics Summary              │
│ ┌─────────┐ ┌─────────┐        │
│ │ Chart 1 │ │ Chart 2 │        │
│ └─────────┘ └─────────┘        │
└─────────────────────────────────┘
```

#### **2. 색상 적용**
```css
/* Main Screen Colors */
.main-screen {
  background-color: var(--gray-50);
  min-height: 100vh;
}

.main-header {
  background-color: #FFFFFF;
  border-bottom: 1px solid var(--gray-100);
  padding: 16px 20px;
}

.quick-actions {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px 20px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### **B. 추천 화면**

#### **1. 레이아웃 구조**
```
┌─────────────────────────────────┐
│ Header (뒤로가기 + 제목)          │
├─────────────────────────────────┤
│ Input Section                   │
│ ┌─────────────────────────────┐ │
│ │ Number Selector             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Preference Settings         │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Generate Button                 │
├─────────────────────────────────┤
│ Results Section                 │
│ ┌─────────┐ ┌─────────┐        │
│ │ Result 1│ │ Result 2│        │
│ └─────────┘ └─────────┘        │
└─────────────────────────────────┘
```

#### **2. 색상 적용**
```css
/* Recommendation Screen Colors */
.recommendation-screen {
  background-color: var(--gray-50);
  min-height: 100vh;
}

.input-section {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px 20px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.results-section {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px 20px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### **C. 통계 화면**

#### **1. 레이아웃 구조**
```
┌─────────────────────────────────┐
│ Header (뒤로가기 + 제목)          │
├─────────────────────────────────┤
│ Chart Section                   │
│ ┌─────────────────────────────┐ │
│ │ Frequency Chart             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Trend Chart                 │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Analysis Section                │
│ ┌─────────┐ ┌─────────┐        │
│ │ Hot     │ │ Cold    │        │
│ │ Numbers │ │ Numbers │        │
│ └─────────┘ └─────────┘        │
└─────────────────────────────────┘
```

#### **2. 색상 적용**
```css
/* Statistics Screen Colors */
.statistics-screen {
  background-color: var(--gray-50);
  min-height: 100vh;
}

.chart-section {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px 20px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.analysis-section {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px 20px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

---

## 🌙 다크 모드 디자인

### **A. 다크 모드 컬러 적용**

#### **1. 기본 다크 모드 스타일**
```css
/* Dark Mode Base Styles */
@media (prefers-color-scheme: dark) {
  .app {
    background-color: var(--dark-background);
    color: var(--dark-text-primary);
  }
  
  .card {
    background-color: var(--dark-surface);
    border-color: var(--dark-border);
  }
  
  .text-primary {
    color: var(--dark-text-primary);
  }
  
  .text-secondary {
    color: var(--dark-text-secondary);
  }
}
```

#### **2. 다크 모드 로또 번호**
```css
/* Dark Mode Lotto Balls */
@media (prefers-color-scheme: dark) {
  .lotto-ball {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .lotto-ball:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
}
```

### **B. 다크 모드 전환 애니메이션**
```css
/* Dark Mode Transition */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

---

## ♿ 접근성 가이드

### **A. 색상 대비**

#### **1. WCAG 2.1 AA 준수**
```css
/* High Contrast Colors */
.high-contrast {
  --text-primary: #000000;
  --text-secondary: #333333;
  --background: #FFFFFF;
  --border: #000000;
}

/* Color Contrast Ratios */
/* Primary Purple (#6C5CE7) on White: 4.5:1 ✓ */
/* Gray-700 (#343A40) on White: 12.6:1 ✓ */
/* White on Dark Background: 21:1 ✓ */
```

#### **2. 색맹 지원**
```css
/* Colorblind Support */
.lotto-ball.range-1-10::after { content: '●'; } /* 빨강 */
.lotto-ball.range-11-20::after { content: '▲'; } /* 파랑 */
.lotto-ball.range-21-30::after { content: '■'; } /* 하늘색 */
.lotto-ball.range-31-40::after { content: '◆'; } /* 초록 */
.lotto-ball.range-41-45::after { content: '★'; } /* 노랑 */
```

### **B. 터치 영역**

#### **1. 최소 터치 영역**
```css
/* Minimum Touch Target Size */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

.lotto-ball {
  width: 48px;
  height: 48px;
  /* 48px > 44px (WCAG 권장) */
}
```

---

## 📐 스페이싱 시스템

### **A. 일관된 스페이싱**
```css
/* Spacing Scale */
--space-1: 4px;    /* 0.25rem */
--space-2: 8px;    /* 0.5rem */
--space-3: 12px;   /* 0.75rem */
--space-4: 16px;   /* 1rem */
--space-5: 20px;   /* 1.25rem */
--space-6: 24px;   /* 1.5rem */
--space-8: 32px;   /* 2rem */
--space-10: 40px;  /* 2.5rem */
--space-12: 48px;  /* 3rem */
--space-16: 64px;  /* 4rem */
--space-20: 80px;  /* 5rem */
```

### **B. 컴포넌트별 스페이싱**
```css
/* Component Spacing */
.card {
  padding: var(--space-6);
  margin: var(--space-4);
}

.button {
  padding: var(--space-4) var(--space-8);
  margin: var(--space-2);
}

.input {
  padding: var(--space-3) var(--space-4);
  margin: var(--space-2) 0;
}
```

---

## 🎭 애니메이션 가이드

### **A. 전환 애니메이션**
```css
/* Transition Animations */
.transition-fast {
  transition: all 0.15s ease;
}

.transition-normal {
  transition: all 0.3s ease;
}

.transition-slow {
  transition: all 0.5s ease;
}
```

### **B. 인터랙션 애니메이션**
```css
/* Interaction Animations */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.press-scale:active {
  transform: scale(0.98);
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 📱 반응형 디자인

### **A. 브레이크포인트**
```css
/* Breakpoints */
--mobile: 320px;
--mobile-large: 375px;
--tablet: 768px;
--desktop: 1024px;
--desktop-large: 1440px;
```

### **B. 반응형 레이아웃**
```css
/* Responsive Layout */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: 0 var(--space-8);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 var(--space-12);
  }
}
```

---

## 🎨 아이콘 및 이미지

### **A. 아이콘 스타일**
```css
/* Icon Styles */
.icon {
  width: 24px;
  height: 24px;
  color: var(--gray-600);
  transition: color 0.2s ease;
}

.icon:hover {
  color: var(--primary-purple);
}

.icon-large {
  width: 32px;
  height: 32px;
}

.icon-small {
  width: 16px;
  height: 16px;
}
```

### **B. 이미지 최적화**
```css
/* Image Optimization */
.image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
}

.image-circle {
  border-radius: 50%;
}

.image-rounded {
  border-radius: 12px;
}
```

---

## 📋 체크리스트

### **A. 디자인 구현 체크리스트**
- [ ] 컬러 팔레트 적용 완료
- [ ] 타이포그래피 시스템 구축
- [ ] 컴포넌트 디자인 완료
- [ ] 다크 모드 지원 구현
- [ ] 접근성 가이드라인 준수
- [ ] 반응형 디자인 적용
- [ ] 애니메이션 효과 구현
- [ ] 아이콘 및 이미지 최적화

### **B. 품질 검사 체크리스트**
- [ ] 색상 대비 검사 (WCAG 2.1 AA)
- [ ] 터치 영역 크기 검사 (최소 44px)
- [ ] 폰트 크기 검사 (최소 16px)
- [ ] 다크 모드 테스트
- [ ] 다양한 화면 크기 테스트
- [ ] 스크린 리더 테스트
- [ ] 색맹 사용자 테스트

---

## 🚀 구현 우선순위

### **A. Phase 1: 기본 디자인 시스템**
1. 컬러 팔레트 정의
2. 타이포그래피 시스템 구축
3. 기본 컴포넌트 디자인
4. 다크 모드 지원

### **B. Phase 2: 고급 디자인 요소**
1. 애니메이션 효과 구현
2. 접근성 기능 추가
3. 반응형 디자인 최적화
4. 아이콘 및 이미지 최적화

### **C. Phase 3: 사용자 경험 최적화**
1. 사용자 피드백 반영
2. 성능 최적화
3. A/B 테스트 진행
4. 최종 품질 검사

---

**이 디자인 가이드를 따라 2025년 모던·그레이 중심의 세련되고 사용자 친화적인 로또 앱을 개발하겠습니다!** 🎨✨
