# 🎓 학원 출결 자동 알림 시스템

> 학생이 학원 입구 키오스크에서 4자리 PIN을 입력하면, 부모님께 자동으로 SMS/카카오톡 알림이 발송되는 시스템

[![Live](https://img.shields.io/badge/Live-attendance--pi--green.vercel.app-brightgreen)](https://attendance-pi-green.vercel.app/)
[![Status](https://img.shields.io/badge/Status-V1.5%20수동발송-orange)]()
[![Vercel](https://img.shields.io/badge/Hosting-Vercel-black)]()
[![License](https://img.shields.io/badge/License-Private-blue)]()

🌐 **Live URL**: <https://attendance-pi-green.vercel.app/>

---

## 📌 무엇인가요?

학원 운영 중 가장 번거로운 일 중 하나인 **학부모 출결 알림**을 자동화하는 키오스크 앱입니다.

**학생 입장**: 학원 도착 → 입구 태블릿(iPhone)에서 4자리 PIN 입력 → 끝
**부모 입장**: 자녀 도착 시 카톡/문자로 즉시 알림 수신
**학원장 입장**: 매일 학생 한 명씩 학부모에게 연락할 필요 없음, 출결 데이터 자동 누적

---

## 🎯 사용자 흐름

```
┌─────────────────────────────────────┐
│  1. 학생 도착                       │
│     ↓                                │
│  2. 입구 키오스크에서 4자리 PIN 입력  │
│     ↓                                │
│  3. [전송] 누름                      │
│     ↓                                │
│  4. 시스템: 학생 식별 + Aligo API 호출│
│     ↓                                │
│  5. 부모님 핸드폰에 SMS 도착 (3~5초) │
│     ↓                                │
│  6. 키오스크: "✓ 등원 완료" 표시     │
└─────────────────────────────────────┘
```

---

## 🏗️ 시스템 구조

```
┌──────────────────┐
│  iPhone 키오스크  │  ← 학원 입구
│  (Safari PWA)    │
└────────┬─────────┘
         │ HTTPS POST + Bearer Token
         ↓
┌──────────────────────────┐
│  Vercel Serverless API    │  ← 이 저장소
│  - /api/send (SMS 발송)   │
│  - /api/balance (잔액 조회)│
└────────┬─────────────────┘
         │ HTTPS API Call
         ↓
┌──────────────────┐
│  Aligo (aligo.in)│  ← 한국 SMS/알림톡 게이트웨이
│  - SMS / LMS     │
│  - 알림톡        │
└────────┬─────────┘
         │ KT/SKT/LGU+ 통신망
         ↓
┌──────────────────┐
│  부모님 핸드폰   │
└──────────────────┘
```

---

## 🛠️ 기술 스택

| 영역 | 기술 | 비용 |
|---|---|---|
| **프론트엔드** | Vanilla HTML/CSS/JavaScript (단일 파일) | 무료 |
| **호스팅** | Vercel Hobby Tier | 무료 |
| **서버리스 함수** | Node.js 18+ on Vercel Functions | 무료 (월 100k 호출 한도) |
| **데이터 저장** | Browser localStorage (클라이언트) | 무료 |
| **SMS API** | 알리고 (aligo.in) | 22원/SMS, 30원/LMS, 8원/알림톡 |
| **버전 관리** | GitHub (Private) | 무료 |
| **CI/CD** | Vercel 자동 배포 (Git 연동) | 무료 |

**예상 월 운영비** (학생 30~100명 기준):
- Vercel: 0원
- GitHub: 0원
- 알리고 충전: 1.5~5만원
- **합계: 약 2~5만원/월**

---

## 📂 파일 구조

```
attendance/
├── index.html          ← 키오스크 + 관리자 통합 앱 (단일 페이지)
├── api/
│   ├── send.js         ← SMS/알림톡 발송 게이트웨이 (서버리스)
│   └── balance.js      ← 알리고 잔액 조회 API
├── vercel.json         ← Vercel 배포 설정 (CORS 헤더)
├── package.json        ← Node.js 버전 명시
├── 배포가이드.md        ← 학원장님 단계별 배포 가이드
└── README.md           ← 이 문서
```

---

## ✨ 주요 기능

### 키오스크 (학생용)
- ✅ 4자리 PIN 입력 → 부모 알림 자동 발송
- ✅ 형제자매 PIN 충돌 시 학생 선택 화면
- ✅ 잘못된 PIN 입력 안내
- ✅ 30분 throttle (같은 학생 중복 입력 차단)
- ✅ 큰 버튼 UI, 어린 학생도 사용 가능
- ✅ 실시간 시계 표시
- ✅ 풀스크린 PWA 모드 (iPhone 홈 화면에 추가)

### 관리자 (학원장용)
- ✅ 학생/학부모 정보 CRUD
- ✅ CSV 일괄 등록 (30~100명 한 번에)
- ✅ 부모 핸드폰 자동 PIN 생성 (뒤 4자리)
- ✅ PIN 충돌 경고 ⚠️
- ✅ 출결 로그 (일/주/월 필터, CSV 내보내기)
- ✅ SMS 메시지 템플릿 편집기 (변수 + 글자수 + 비용 미리보기)
- ✅ 발송 통계 대시보드
- ✅ 발송 실패 자동 감지 + 재시도
- ✅ 알리고 잔액 조회
- ✅ JSON 백업/복구

### 보안
- ✅ AUTH_TOKEN 기반 API 인증
- ✅ Aligo API Key는 서버 환경변수에만 저장 (브라우저 노출 안 됨)
- ✅ Private GitHub 저장소
- ✅ HTTPS 강제 (Vercel)

---

## 🚀 배포 방식

이 저장소는 **Vercel과 자동 연동**되어 있어요. GitHub에 push하면 1~2분 내 자동 배포됩니다.

### 코드 수정 후 자동 배포

```bash
# 로컬에서 파일 수정 후
git add .
git commit -m "수정 내용"
git push origin main

# → Vercel이 자동으로 감지 → 1~2분 후 배포 완료
```

### Vercel 환경변수 (배포 후 설정)

Vercel Dashboard → Project → Settings → Environment Variables:

| Key | 설명 | 어디서? |
|---|---|---|
| `ALIGO_API_KEY` | 알리고 API Key | 알리고 콘솔 → API 사용 신청 |
| `ALIGO_USER_ID` | 알리고 가입 ID | 가입 시 만든 ID |
| `ALIGO_SENDER` | 등록된 발신번호 | 알리고에 등록한 번호 (예: 01012345678) |
| `AUTH_TOKEN` | 키오스크-API 인증 토큰 | 학원장이 직접 정한 비밀 문자열 |
| `ALIMTALK_TEMPLATE_CODE` | 알림톡 템플릿 코드 (선택) | 카카오 심사 통과 후 알리고에서 발급 |

> ⚠️ 환경변수 변경 후 **재배포 필수** (Deployments → Redeploy)

---

## 📊 셋업 진행 현황

### ✅ 완료된 것
- [x] 시스템 설계 (Deep Interview 7 라운드)
- [x] 합의 계획서 (Ralplan: Planner/Architect/Critic 합의 8.2/10)
- [x] V1 앱 (오프라인 수동 모드) — `attendance/index.html`
- [x] HTML 데모 — `attendance/kiosk-demo.html`
- [x] V2 앱 (Vercel 자동 모드) — 이 저장소
- [x] GitHub 저장소 생성 + 코드 push
- [x] Vercel 배포 ⭐ <https://attendance-pi-green.vercel.app/>
- [x] 알리고 가입
- [x] 알리고 사업자 인증 신청

### ⏳ 진행 중 / 대기
- [ ] 알리고 사업자 인증 담당자 확인 (대기 중)
- [ ] 알리고 발신번호 등록 승인 (영업일 1~2일)
- [ ] 알리고 API Key 발급 (사업자 인증 후)
- [ ] Vercel 환경변수에 진짜 ALIGO_API_KEY 입력 + 재배포
- [ ] 키오스크 앱 → 자동 발송 모드 ON 전환
- [ ] 학원 정보 설정 (학원명, 관리자 PIN, 메시지 템플릿)
- [ ] 학생/학부모 정보 등록
- [ ] 첫 부모님께 테스트 SMS 발송
- [ ] 카카오 알림톡 템플릿 신청 (영업일 7~14일 심사)
- [ ] 알림톡 모드 활성화 (단가 22원 → 8원 절감)

### 🔮 향후 계획 (V2/V3)
- [ ] 등원 + 하원 알림 (현재 등원만)
- [ ] 결석 자동 감지 + 알림
- [ ] 학원장 모바일 대시보드
- [ ] 학부모 셀프 서비스 (번호 변경 등)
- [ ] 멀티 기기 동기화 (Supabase 도입 검토)

---

## 🔧 운영 가이드

### 일상 운영
1. iPhone 키오스크를 학원 입구에 거치
2. WiFi 연결 + 충전 케이블 연결
3. iPhone 설정에서 자동 잠금 OFF
4. iPhone 가이드 액세스로 Safari 잠금
5. 학생들이 자유롭게 PIN 입력
6. 학원장은 모니터링만

### 학생 등록 (CSV 일괄)
```csv
홍길동,홍부모,01012345678,초등4학년,
김철수,김아빠,01098765432,초등3학년,
박민준,박엄마,01011117777,초등5학년,7777
```
관리자 → 학생 관리 → CSV 일괄 등록 → 위 형식으로 붙여넣기

### 매주 백업
- 관리자 → 백업/복구 → 📥 백업 파일 다운로드
- JSON 파일을 USB·이메일·구글드라이브에 보관

### 알리고 잔액 모니터링
- 관리자 → 자동발송 → 💰 잔액 조회 버튼
- 1만원 미만 시 충전 권장

---

## 🐛 문제 해결

| 문제 | 해결 |
|---|---|
| 키오스크 화면 안 열림 | URL 정확한지 확인, WiFi 연결 확인 |
| "발송 실패" 표시 | 자동발송 → 연결 테스트 → 환경변수 확인 |
| 부모가 SMS 못 받음 | 부모 번호 정확한지, 알리고 잔액 충분한지 확인 |
| 학생 데이터 사라짐 | 시크릿 모드 사용? 캐시 삭제? → 백업 파일로 복구 |
| Vercel 환경변수 변경 안 적용 | Deployments → Redeploy 필수 |

자세한 트러블슈팅은 `배포가이드.md` 참고.

---

## 📜 프로젝트 여정

이 프로젝트는 비개발자(학원장)가 AI(Claude)와 함께 단계적으로 만든 **자체 출결 시스템**입니다.

```
[Day 1]
  ├─ Deep Interview (7 라운드, 모호도 100% → 17.3%)
  ├─ Ralplan 합의 계획서 (Planner→Architect→Critic, 8.2/10)
  ├─ HTML 데모 (단일 파일 키오스크 시연)
  ├─ V1 완성형 앱 (localStorage 기반, 오프라인 작동)
  ├─ 알리고 가입 + 발신번호 신청
  ├─ GitHub 가입 + 저장소 생성
  ├─ V2 Vercel 자동발송 코드 작성
  └─ Vercel 배포 완료 ⭐
```

**작성된 산출물**:
- 명세서: `.omc/specs/deep-interview-출결앱.md`
- 합의 계획서: `.omc/plans/ralplan-출결앱-v2.md`
- 코드: 이 저장소

---

## 🤝 기여 / 기여자

- **학원장**: 요구사항 정의, 의사결정, 외부 서비스 가입, GitHub/Vercel 배포 실행
- **AI(Claude)**: 시스템 설계, 명세서·계획서 작성, 코드 작성, 가이드 문서 작성

---

## 📝 라이선스

이 코드는 학원장 본인 사용을 위해 제작되었습니다. 무단 복제/배포 금지.

---

## 📞 도움말

문제 발생 시:
1. 화면 캡처
2. 에러 메시지 (있으면)
3. AI 또는 개발자에게 문의

---

**Last Updated**: 2026년 5월 5일
**Live**: <https://attendance-pi-green.vercel.app/>
**Status**: V1.5 (수동 발송 모드) → V2 자동 발송 (알리고 API Key 발급 후)
