# 🚀 Burnout Detector (Applied Data Analysis Project)

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/hojun-lee.burnout-detector?style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=hojun-lee.burnout-detector)

개발자 행동 패턴 분석을 통한 **번아웃(Burnout) 징후 감지 및 예측**을 연구 목적으로 개발된 VS Code 확장 프로그램입니다.

---

## 📅 프로젝트 현황 (Update: 2026-04-03)
연구 참여율 극대화 및 글로벌 유저 확보를 위한 **v0.2.2 업데이트**가 완료되었습니다.
- **Visual Studio Marketplace**: v0.2.2 글로벌 버전 배포 완료 [[설치하기]](https://marketplace.visualstudio.com/items?itemName=hojun-lee.burnout-detector).
- **Internationalization (i18n)**: 영문 메시지 지원을 통해 전 세계 개발자(Global Users) 수집 기반 마련.
- **Earnest Outreach**: 연구의 진정성과 간절함을 담은 이중 언어(Bilingual) 동의 메시지 도입으로 참여율 유도.
- **Improved UX**: "동료 개발자의 졸업 연구를 도와달라"는 메시지를 통해 사용자의 심리적 유대감 및 연구 협조도 향상.
- **Data Verification**: v0.2.1 이후 도입된 정밀 지표(유휴 시간, 파일 전환 등)가 실시간으로 수집되고 있음을 최종 확인.

---

## 📥 설치 (Installation)
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=hojun-lee.burnout-detector)에서 설치하거나, 마켓플레이스에서 `hojun-lee.burnout-detector`를 검색하세요.

## 🛠 주요 기능 (Key Features)

연구 데이터 확보를 위해 다음과 같은 세부 지표를 수집합니다.

### 1. 타이핑 패턴 분석 (Typing & Editing)
*   **속도 변화**: 초 단위의 타이핑 빈도를 기록하여 업무 몰입도 변화를 추적합니다.
*   **복사/붙여넣기 비율 (v0.2.0+)**: 직접 입력 대비 붙여넣기된 글자 수를 구분하여 로직 고민 패턴을 분석합니다.
*   **수정 및 삭제 (Churn)**: Undo/Redo 발생 횟수와 삭제된 글자 수(`charsDeleted`)를 측정하여 작업의 불확실성을 분석합니다.

### 2. 업무 몰입도 및 집중력 (Focus & Flow)
*   **파일 전환 분석 (v0.2.0+)**: 작업 중 탭 이동 빈도를 측정하여 집중력 분산(Context Switching) 상태를 파악합니다.
*   **유휴 시간 추적 (v0.2.0+)**: 코딩 중 30초 이상의 무활동 시간을 감지하여 인지적 정체 상태를 분석합니다.

### 3. 에러 해결 패턴 (Diagnostic Tracking)
*   **해결 시간(ms)**: 에러 발생 후 해결까지 걸리는 시간을 측정하여 인지적 부하를 계산합니다.
*   **에러 분류**: 단순 오타(Basic)와 복잡한 논리 에러(Complex)를 구분하여 해결 패턴의 차이를 분석합니다.

### 4. 데이터 익명성 및 보안
*   **사용자 동의(Consent)**: 최초 실행 시 간절함이 담긴 메시지를 통해 데이터 수집 동의 여부를 확인합니다.
*   **익명화**: 모든 데이터는 랜덤하게 생성된 익명 ID와 연결되며 실제 코드 내용은 포함되지 않습니다.

---

## 🏗 시스템 구조 (Architecture)

```text
[VS Code Extension] ----(JSON Data)----> [Render Backend] ----> [MongoDB Atlas]
 (v0.2.2 Global Ver.)                    (Health Check)         (Cloud Storage)
```

- **Extension**: 글로벌 유저를 위해 다국어 메시지를 지원하며 안정적으로 데이터를 전송합니다.
- **Backend (Render)**: MongoDB 연결 상태를 실시간 모니터링하며 데이터 유효성을 검사합니다.
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
1. 프로젝트 폴더를 VS Code로 엽니다.
2. `F5`를 눌러 [Extension Development Host] 모드로 실행합니다.
3. 타이핑, 파일 전환, 유휴 시간 발생 시 데이터가 자동으로 서버로 전송됩니다 (20개 이벤트 단위).

---

## 📈 향후 계획 (Next Steps)
*   [x] **글로벌 배포**: 영문 메시지 지원을 통한 전 세계 유저 수집 시작.
*   [x] **DB 안정화**: MongoDB Atlas 연결 리팩토링 및 재시도 로직 구현 완료.
*   [x] **참여율 최적화**: 심리적 유대감을 강조한 동의 메시지 업데이트 완료.
*   **언어별 규칙 확장**: Python, C++, JS 등 더 많은 언어의 에러 분류 규칙 추가.
*   **데이터 상관관계 도출**: 수집된 수치와 실제 피로도 설문 데이터를 대조하여 번아웃 예측 모델 설계.

## 배포 방법
* https://marketplace.visualstudio.com/items?itemName=hojun-lee.burnout-detector

---

**연구 및 기술 문의**: [monolail](https://github.com/monolail)
