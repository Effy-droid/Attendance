# 학원 출결 자동 알림 시스템 (Vercel 버전)

> 학생 PIN 입력 → 즉시 부모님께 SMS/알림톡 자동 발송
> 학원장님 손길 0번. 풀 자동화.

## 📁 폴더 구조

```
attendance-vercel/
├── index.html        ← 메인 키오스크 앱 (Vercel이 이걸 보여줌)
├── api/
│   ├── send.js       ← 알리고 SMS/알림톡 발송 게이트웨이
│   └── balance.js    ← 알리고 잔액 조회 API
├── vercel.json       ← Vercel 배포 설정
├── package.json      ← Node.js 버전 명시
├── 배포가이드.md     ← ⭐ 학원장님 단계별 배포 가이드
└── README.md         ← 이 문서
```

## 🚀 빠른 시작

**[배포가이드.md](배포가이드.md)** 파일을 열어 단계별로 따라가세요.

총 4단계, 30~45분 소요:
1. GitHub 가입 + 코드 업로드 (10~15분)
2. Vercel 가입 + 배포 (5~10분)
3. 키오스크에 연결 (5분)
4. 첫 SMS 테스트 (5분)

## 🏗️ 시스템 구조

```
[학생 iPhone 키오스크]
    ↓ PIN 입력
    ↓ POST /api/send (with Authorization token)
[Vercel Serverless Function]
    ↓ 환경변수에서 알리고 자격증명 로드
    ↓ POST https://apis.aligo.in/send/
[알리고 API]
    ↓ KT/SKT/LGU+ 인프라
[부모님 핸드폰] 📱
```

## 🔐 보안 설계

- **AUTH_TOKEN**: 키오스크와 Vercel API 사이 비밀 토큰
  - 키오스크에서 매 요청에 `Authorization: Bearer <token>` 헤더로 전송
  - 토큰 모르면 누구도 SMS 발송 불가 (잔액 도용 방지)
- **API Key 분리**: 알리고 API Key는 **Vercel 환경변수에만** 저장
  - 브라우저(클라이언트) 코드에 절대 노출되지 않음
  - 학생들 폰에서도 추출 불가능
- **CORS 정책**: 모든 출처 허용 (`Access-Control-Allow-Origin: *`)
  - 단, AUTH_TOKEN으로 무단 사용 차단

## 🛠️ 환경변수 설정

Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Value | 필수 |
|---|---|---|
| `ALIGO_API_KEY` | 알리고 API Key (콘솔에서 발급) | ✅ |
| `ALIGO_USER_ID` | 알리고 가입 ID | ✅ |
| `ALIGO_SENDER` | 알리고 등록 발신번호 (예: 01012345678) | ✅ |
| `AUTH_TOKEN` | 학원장 정의 비밀 토큰 (긴 랜덤 문자열) | ✅ |
| `ALIMTALK_TEMPLATE_CODE` | 알림톡 템플릿 코드 (승인 후) | ⭕ 선택 |

환경변수 변경 후 **재배포 필수** (Deployments 탭 → "Redeploy")

## 📡 API 엔드포인트

### POST /api/send

학생 등원 시 SMS/알림톡 발송 요청.

**Headers:**
```
Authorization: Bearer <AUTH_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "01012345678",
  "message": "[행복학원] 홍길동 등원 16:30",
  "studentName": "홍길동",
  "type": "sms",
  "idempotencyKey": "uuid-v4"
}
```

**Response (성공):**
```json
{
  "ok": true,
  "type": "sms",
  "msgId": 12345678,
  "balance": 1234,
  "message": "발송 성공"
}
```

**Response (실패):**
```json
{
  "ok": false,
  "type": "sms",
  "code": "10",
  "error": "잔액 부족"
}
```

### GET /api/balance

알리고 잔액 조회.

**Headers:**
```
Authorization: Bearer <AUTH_TOKEN>
```

**Response:**
```json
{
  "ok": true,
  "smsCount": 1234,
  "lmsCount": 567,
  "mmsCount": 89,
  "totalKrw": 12345
}
```

## 🐛 문제 해결

### 키오스크에서 "발송 실패" 표시
1. 관리자 → 자동발송 → "🧪 연결 테스트" 클릭
2. 실패 사유 확인 (대부분: 환경변수 또는 잔액 부족)

### Vercel 배포 실패
1. Vercel Dashboard → Deployments → 실패 항목 → "View Build Logs"
2. 일반적 원인:
   - `package.json` 형식 오류
   - `api/` 폴더 안의 .js 파일 syntax error
3. 학원장님 PC의 파일과 GitHub의 파일을 비교

### CORS 오류 (브라우저 콘솔에 빨간 메시지)
- `vercel.json` 파일이 정상 배포되었는지 확인
- 또는 Vercel 자동 CORS 설정으로 충분 (현재 코드에 직접 명시됨)

## 📊 사용 한도 (무료 티어)

### Vercel Hobby (무료)
- 월 100GB bandwidth (학원 규모 충분)
- 월 100,000 serverless function invocations
- 학생 100명 × 매일 등원 = 월 약 2,000건 → **무료 한도의 2%만 사용**

### GitHub Free (무료)
- Private repository 무제한
- 작업자 무제한 (학원장 1명만 사용)

### 알리고 (유료)
- 가입 무료, 충전 후 사용
- SMS 22원/건, LMS 30원/건, 알림톡 8원/건

## 🔄 업데이트

기능 개선이나 버그 수정 시:
1. 학원장님 PC의 `attendance-vercel/` 폴더 파일 수정
2. GitHub 웹에서 해당 파일 열기 → 연필 아이콘 → 새 코드 붙여넣기 → Commit
3. Vercel이 자동으로 감지하여 재배포 (1~2분)

## 📞 도움 요청

막히는 부분 있으면:
1. 화면 스크린샷
2. 에러 메시지 (있으면)
3. AI(Claude)에게 보여주시면 해결책 안내

## 📋 라이선스 / 사용 권한

이 코드는 학원장님 전용으로 제작되었으며, 자유롭게 수정·확장 가능합니다.

---

**버전**: 2.0 (Vercel 자동발송)
**작성일**: 2026년 5월 5일
