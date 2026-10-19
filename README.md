# 마음잇기 AI 💖

초등 고학년을 위한 **감정·갈등 해결 연습 도구**  
GitHub Pages에 바로 배포할 수 있는 완전 정적 웹 애플리케이션입니다.

귀여운 따뜻한 UI로 아이들이 부담 없이 갈등 상황을 연습할 수 있도록 만들었습니다.

## 특징

- 시나리오 **1000개** 포함
- 개인정보 수집 없음 (모든 성찰 기록은 브라우저 LocalStorage에만 저장)
- 서버 없이 동작
- 초등 고학년 눈높이에 맞춘 귀여운 UI (파스텔 톤, 둥근 모서리, 이모지, **부드러운 애니메이션**)
- 미리 준비된 시나리오 기반 역할극·공감 연습

## 프로젝트 구조

```
maeum-itgi/
├── index.html          # 메인 페이지
├── styles.css          # 스타일 (귀여운 테마)
├── script.js           # 동작 로직
├── scenarios.json      # 시나리오 데이터 (1000개)
└── README.md
```

## 로컬에서 실행하기

1. 이 폴더를 다운로드하거나 클론합니다.
2. 간단한 로컬 서버를 실행합니다.

```bash
# Python이 있는 경우
python -m http.server 8000
```

3. 브라우저에서 `http://localhost:8000` 접속

## GitHub Pages 배포 방법

1. GitHub에 새 저장소를 만듭니다.
2. 이 폴더의 파일들을 모두 업로드합니다.
3. Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/ (root)`
4. 몇 분 후 `https://사용자명.github.io/저장소명/` 으로 접속 가능

## 시나리오 추가하기

`scenarios.json`의 `scenarios` 배열에 객체를 추가하면 됩니다.

## 라이선스

교육 목적 사용을 위해 자유롭게 활용·수정할 수 있습니다.
