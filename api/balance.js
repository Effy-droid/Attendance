// 알리고 잔액 조회 API
// 키오스크 또는 관리자 화면에서 호출하여 잔액 모니터링

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 인증 토큰 확인
  const expectedToken = process.env.AUTH_TOKEN;
  const authHeader = req.headers.authorization || '';
  const providedToken = authHeader.replace(/^Bearer\s+/i, '');
  if (providedToken !== expectedToken) {
    return res.status(401).json({ ok: false, error: '인증 실패' });
  }

  const aligoKey = process.env.ALIGO_API_KEY;
  const aligoUserId = process.env.ALIGO_USER_ID;

  try {
    const formData = new URLSearchParams();
    formData.append('key', aligoKey);
    formData.append('user_id', aligoUserId);

    const response = await fetch('https://apis.aligo.in/remain/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const data = await response.json();

    if (String(data.result_code) === '1') {
      return res.status(200).json({
        ok: true,
        smsCount: parseInt(data.SMS_CNT) || 0,
        lmsCount: parseInt(data.LMS_CNT) || 0,
        mmsCount: parseInt(data.MMS_CNT) || 0,
        totalKrw: parseInt(data.balance || 0)
      });
    } else {
      return res.status(400).json({
        ok: false,
        error: data.message || '잔액 조회 실패'
      });
    }
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || error.toString()
    });
  }
}
