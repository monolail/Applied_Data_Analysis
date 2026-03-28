# 🚀 Burnout Detector (Applied Data Analysis Project)

개발자 행동 패턴 분석을 통한 **번아웃(Burnout) 징후 감지 및 예측**을 연구 목적으로 개발된 VS Code 확장 프로그램입니다.

---

## 📅 프로젝트 현황 (Update: 2026-03-28)
실제 연구 데이터를 수집하기 위해 클라우드 DB 연결 및 백엔드 안정화 작업이 완료되었습니다.
- **VS Code Extension**: 사용자 행동(타이핑, 에러 해결) 실시간 추적 및 전송 로직 강화.
- **Render Deployment**: Render 클라우드 서버에 백엔드 배포 완료 및 안정적 운영 중.
- **MongoDB Atlas (Cloud)**: 수집된 데이터를 안전하게 저장하는 클라우드 DB 연동 및 **IP Whitelist(0.0.0.0/0) 설정** 완료.
- **Data Verification**: 실제 사용자 로그가 MongoDB에 정상적으로 기록되고 있음을 최종 확인(2026-03-28).

---

## 🛠 주요 기능 (Key Features)

연구 데이터 확보를 위해 다음과 같은 세부 지표를 수집합니다.

### 1. 타이핑 패턴 분석
*   **속도 변화**: 초 단위의 타이핑 빈도(KPM/WPM)를 기록하여 업무 몰입도 변화를 추적합니다.
*   **수정 반복 행동**: Undo/Redo 발생 횟수와 간격을 측정하여 작업의 불확실성을 분석합니다.

### 2. 에러 해결 패턴 (Diagnostic Tracking)
*   **해결 시간(ms)**: 에러 발생 후 해결까지 걸리는 시간을 측정하여 인지적 부하를 계산합니다.
*   **에러 분류**: 단순 오타(Basic)와 복잡한 논리 에러(Complex)를 구분하여 해결 패턴의 차이를 분석합니다.

### 3. 데이터 익명성 및 보안
*   **사용자 동의(Consent)**: 최초 실행 시 데이터 수집 동의 여부를 확인합니다.
*   **익명화**: 모든 데이터는 랜덤하게 생성된 익명 ID와 연결되며 개인정보는 포함되지 않습니다.

---

## 🏗 시스템 구조 (Architecture)

```text
[VS Code Extension] ----(JSON Data)----> [Render Backend] ----> [MongoDB Atlas]
 (src/tracker.ts)                        (server.js)            (Cloud Storage)
```

- **Extension**: VS Code 환경의 이벤트를 감지하고 가공하여 서버로 전송합니다.
- **Backend (Render)**: 데이터 유효성을 검사하고 로그를 관리하며 24시간 가동됩니다.
- **Cloud DB (Atlas)**: 모든 IP(0.0.0.0/0)에서의 안전한 접근을 허용하여 클라우드 환경에서도 중단 없는 데이터 저장이 가능합니다.

---

## 🚀 시작 가이드 (Quick Start)

### 1. 백엔드 설정 (Backend)
```bash
cd backend
npm install
# .env 파일에 MONGODB_URI 설정 확인 (Atlas Connection String)
node server.js
```

### 2. 확장 프로그램 실행 (Extension)
1. `extension` 폴더를 VS Code로 엽니다.
2. `F5`를 눌러 [Extension Development Host] 모드로 실행합니다.
3. 타이핑이나 에러 발생 시 데이터가 자동으로 서버로 전송됩니다 (10개 이벤트 단위).

---

## 📈 향후 계획 (Next Steps)
*   [x] **클라우드 서버 배포**: Render를 활용한 24시간 수집 서버 운용 완료.
*   [x] **DB 방화벽 설정**: MongoDB Atlas와 Render 서버 간의 IP 연동 문제 해결.
*   **언어별 규칙 확장**: Python, C++, JS 등 더 많은 언어의 에러 분류 규칙 추가.
*   **데이터 상관관계 도출**: 수집된 수치와 실제 피로도 설문 데이터를 대조하여 번아웃 예측 모델 설계.

---

**연구 및 기술 문의**: [monolail](https://github.com/monolail)
