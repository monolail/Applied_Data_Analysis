# 🧠 Burnout Detector (Applied Data Analysis Project)

본 프로젝트는 개발자의 코딩 행동 패턴을 분석하여 **번아웃(Burnout) 징후를 사전에 감지**하고 예방하기 위한 연구 목적으로 개발된 VS Code 익스텐션 및 데이터 수집 시스템입니다.

---

## 🚀 오늘의 주요 성과 (Update: 2026-03-26)

행동 데이터 수집을 위한 핵심 엔진 구현과 데이터 파이프라인(Extension ➡️ Backend ➡️ Cloud DB) 구축을 완벽하게 마쳤습니다.

### 1️⃣ 4대 핵심 행동 데이터 수집 엔진 구축
*   **타이핑 동학 분석:** 1초 단위 입력을 묶어 효율적으로 타이핑 속도(KPM/WPM)를 추적합니다.
*   **에러 생애주기 추적:** 에러 발생 시점부터 해결 시점까지의 시간(ms)을 기록하여 인지 부하를 측정합니다.
*   **지능형 에러 분류:** 키워드 기반으로 '단순 실수(Basic)'와 '복잡한 논리 오류(Complex)'를 자동 구분합니다.
*   **수정 행동 감지:** Undo/Redo 발생 빈도를 추적하여 판단력 저하 및 반복 수정 패턴을 포착합니다.

### 2️⃣ 실시간 데이터 파이프라인 완공
*   **VS Code Extension:** 행동 데이터를 실시간 감지하여 익명화된 JSON 형태로 가공합니다.
*   **Express Backend:** 데이터 수집 전용 API 서버를 구축하여 전송받은 로그를 처리합니다.
*   **MongoDB Atlas (Cloud):** 수집된 데이터를 클라우드 데이터베이스에 안전하게 영구 저장합니다.

### 3️⃣ 사용자 보호 및 익명화
*   최초 실행 시 데이터 수집 동의 팝업을 통한 **연구 윤리(Consent)** 준수.
*   개인정보 식별이 불가능한 **익명 사용자 ID(UUID)** 생성 및 관리.

---

## 🏗️ 시스템 아키텍처

```text
[VS Code Extension] ───(JSON Data)───▶ [Node.js Backend] ───▶ [MongoDB Atlas]
(src/tracker.ts)                         (server.js)              (Cloud Storage)
```

---

## 📂 프로젝트 구조

*   `extension/`: VS Code 익스텐션 소스 코드 (TypeScript)
*   `backend/`: 데이터 수집 서버 소스 코드 (Express/Mongoose)

---

## 🛠️ 시작하기 (Quick Start)

### 1. 백엔드 서버 설정
```bash
cd backend
npm install
# .env 파일에 MONGODB_URI=your_atlas_uri 를 설정하세요
node server.js
```

### 2. 익스텐션 실행
1. `extension` 폴더를 VS Code로 엽니다.
2. `F5`를 눌러 디버깅 모드로 실행합니다.
3. 10회 이상의 타이핑/에러 수정 행동이 발생하면 자동으로 서버로 데이터가 전송됩니다.

---

## 📊 향후 계획 (Next Steps)
*   **에러 분석 고도화:** 언어별(Python, C++, JS 등) 특화된 에러 분류 로직 추가.
*   **클라우드 서버 배포:** Render/Railway를 활용한 24시간 수집 서버 가동.
*   **빅데이터 분석:** 수집된 행동 패턴과 실제 번아웃 징후 간의 상관관계 연구 및 ML 모델 설계.

---

**연구 및 기여 문의:** [monolail](https://github.com/monolail)
