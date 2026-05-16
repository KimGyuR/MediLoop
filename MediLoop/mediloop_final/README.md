# MediLoop - AI 자가진단 앱

React와 TypeScript로 만든 의료 진단 앱입니다.

## 기능

- 💊 **증상 검사**: 사용자의 증상을 선택하고 입력
- 🤖 **AI 진단**: AI 기반 자동 진단 결과 제공
- 🏥 **병원 찾기**: 근처 병원 검색 및 위치 안내
- 📊 **진단 결과**: 상세한 진단 결과 및 권장사항

## 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 기술 스택

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router DOM

## 프로젝트 구조

```
src/
  ├── components/      # 재사용 가능한 컴포넌트
  ├── pages/          # 페이지 컴포넌트
  ├── types/          # TypeScript 타입 정의
  ├── data/           # 모의 데이터
  ├── App.tsx         # 메인 앱 컴포넌트
  ├── main.tsx        # 진입점
  └── index.css       # 글로벌 스타일
```

## 페이지

1. **홈 페이지**: 증상 선택 및 AI 진단 시작
2. **진단 결과 페이지**: 상세한 진단 결과 및 권장사항
3. **병원 찾기 페이지**: 근처 병원 검색
4. **Fit-Bing**: 건강 관리 정보 (곧 추가 예정)
5. **마이페이지**: 개인정보 및 진단 기록 (곧 추가 예정)