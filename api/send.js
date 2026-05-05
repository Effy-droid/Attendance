// 학원 출결 알림 — Vercel Serverless Function
// 알리고 SMS/알림톡 발송 게이트웨이
//
// 환경변수 (Vercel Dashboard → Settings → Environment Variables):
//   ALIGO_API_KEY     알리고에서 발급받은 API Key
//   ALIGO_USER_ID     알리고 가입 시 사용한 User ID
//   ALIGO_SENDER      알리고에 등록한 발신번호 (예: 0212345678 또는 01012345678)
//   AUTH_TOKEN        학원장님이 정한 비밀 토큰 (키오스크에 입력하는 값)
//   ALIMTALK_TEMPLATE_CODE  (선택) 알림톡 템플릿 코드 (승인 후 입력)

export default async function handler(req, res) {
  // CORS 설정 (브라우저에서 호출 가능하게)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST 요청만 허용됩니다' });
  }

  // ===== 인증 토큰 검증 =====
  const expectedToken = process.env.AUTH_TOKEN;
  if (!expectedToken) {
    return res.status(500).json({
      ok: false,
      error: '서버에 AUTH_TOKEN이 설정되지 않았습니다. Vercel 환경변수를 확인하세요.'
    });
  }
  const authHeader = req.headers.authorization || '';
  const providedToken = authHeader.replace(/^Bearer\s+/i, '');
  if (providedToken !== expectedToken) {
    return res.status(401).json({
      ok: false,
      error: '인증 토큰이 올바르지 않습니다. 키오스크 설정의 API 토큰을 확인하세요.'
    });
  }

  // ===== 요청 파싱 =====
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const {
    phone,
    message,
    studentName,
    type = 'sms',  // 'sms' | 'alimtalk'
    idempotencyKey
  } = body;

  if (!phone || !message) {
    return res.status(400).json({
      ok: false,
      error: '핸드폰 번호와 메시지는 필수입니다'
    });
  }

  // 한국 핸드폰 번호 형식 검증
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (!/^01[0-9]{8,9}$/.test(cleanPhone) && !/^0[0-9]{8,10}$/.test(cleanPhone)) {
    return res.status(400).json({
      ok: false,
      error: `올바른 한국 전화번호 형식이 아닙니다: ${phone}`
    });
  }

  // ===== 알리고 자격증명 확인 =====
  const aligoKey = process.env.ALIGO_API_KEY;
  const aligoUserId = process.env.ALIGO_USER_ID;
  const aligoSender = process.env.ALIGO_SENDER;

  if (!aligoKey || !aligoUserId || !aligoSender) {
    return res.status(500).json({
      ok: false,
      error: '알리고 자격증명이 서버에 설정되지 않았습니다. Vercel 환경변수(ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER)를 확인하세요.'
    });
  }

  // ===== 알림톡 발송 (템플릿 승인된 경우) =====
  if (type === 'alimtalk') {
    const templateCode = process.env.ALIMTALK_TEMPLATE_CODE;
    if (!templateCode) {
      return res.status(500).json({
        ok: false,
        error: '알림톡 템플릿 코드(ALIMTALK_TEMPLATE_CODE)가 설정되지 않았습니다. SMS 모드로 전환하거나 템플릿 승인 후 환경변수를 설정하세요.'
      });
    }
    return await sendAlimtalk({
      aligoKey, aligoUserId, aligoSender,
      templateCode,
      receiver: cleanPhone,
      subject: `[${studentName || '학생'}] 등원 알림`,
      message,
      res
    });
  }

  // ===== SMS 발송 =====
  return await sendSms({
    aligoKey, aligoUserId, aligoSender,
    receiver: cleanPhone,
    message,
    res
  });
}

// ============================================
// SMS 발송 함수
// ============================================
async function sendSms({ aligoKey, aligoUserId, aligoSender, receiver, message, res }) {
  try {
    const formData = new URLSearchParams();
    formData.append('key', aligoKey);
    formData.append('user_id', aligoUserId);
    formData.append('sender', aligoSender.replace(/\D/g, ''));
    formData.append('receiver', receiver);
    formData.append('msg', message);
    // 한글 기준: 45자 이하 = SMS, 초과 = LMS
    formData.append('msg_type', message.length > 45 ? 'LMS' : 'SMS');

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const data = await response.json();

    // 알리고 응답 코드: 1 = 성공, 그 외 = 실패
    if (String(data.result_code) === '1') {
      return res.status(200).json({
        ok: true,
        type: 'sms',
        msgId: data.msg_id,
        balance: data.SMS_CNT,  // 남은 SMS 발송 가능 건수
        message: data.message || '발송 성공'
      });
    } else {
      return res.status(400).json({
        ok: false,
        type: 'sms',
        code: data.result_code,
        error: data.message || '알리고 발송 실패'
      });
    }
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: '서버 오류: ' + (error.message || error.toString())
    });
  }
}

// ============================================
// 알림톡 발송 함수
// ============================================
async function sendAlimtalk({ aligoKey, aligoUserId, aligoSender, templateCode, receiver, subject, message, res }) {
  try {
    const formData = new URLSearchParams();
    formData.append('apikey', aligoKey);
    formData.append('userid', aligoUserId);
    formData.append('token', '');  // 알리고 발신 토큰 (별도 인증 후 발급)
    formData.append('senderkey', '');  // 발신 프로필 키 (필요 시)
    formData.append('tpl_code', templateCode);
    formData.append('sender', aligoSender.replace(/\D/g, ''));
    formData.append('receiver_1', receiver);
    formData.append('subject_1', subject);
    formData.append('message_1', message);
    // 알림톡 실패 시 SMS 자동 폴백
    formData.append('failover', 'Y');
    formData.append('fsubject_1', subject);
    formData.append('fmessage_1', message);

    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const data = await response.json();

    if (String(data.code) === '0' || String(data.result_code) === '1') {
      return res.status(200).json({
        ok: true,
        type: 'alimtalk',
        msgId: data.info?.mid || data.msg_id,
        message: data.message || '알림톡 발송 성공'
      });
    } else {
      return res.status(400).json({
        ok: false,
        type: 'alimtalk',
        code: data.code || data.result_code,
        error: data.message || '알림톡 발송 실패'
      });
    }
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: '서버 오류: ' + (error.message || error.toString())
    });
  }
}
