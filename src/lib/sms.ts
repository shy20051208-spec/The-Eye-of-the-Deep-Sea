export type SmsProvider = 'mock' | 'tencent' | 'aliyun';

export type SmsConfig = {
  provider: SmsProvider;
  enabled: boolean;
  appId?: string;
  appKey?: string;
  secretId?: string;
  secretKey?: string;
  signName?: string;
  templateId?: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
};

export function normalizePhone(rawPhone?: string | null): string {
  const value = String(rawPhone ?? '').trim();
  const normalized = value.replace(/\s+/g, '').replace(/^\+86/, '');
  return normalized;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function buildSmsConfig(): SmsConfig {
  const provider = (process.env.SMS_PROVIDER ?? 'mock').toLowerCase();

  if (provider === 'tencent') {
    return {
      provider: 'tencent',
      enabled: Boolean(process.env.TENCENT_SMS_SECRET_ID && process.env.TENCENT_SMS_SECRET_KEY && process.env.TENCENT_SMS_APP_ID && process.env.TENCENT_SMS_SIGN_NAME && process.env.TENCENT_SMS_TEMPLATE_ID),
      secretId: process.env.TENCENT_SMS_SECRET_ID,
      secretKey: process.env.TENCENT_SMS_SECRET_KEY,
      appId: process.env.TENCENT_SMS_APP_ID,
      signName: process.env.TENCENT_SMS_SIGN_NAME,
      templateId: process.env.TENCENT_SMS_TEMPLATE_ID,
      region: process.env.TENCENT_SMS_REGION ?? 'ap-guangzhou',
      endpoint: process.env.TENCENT_SMS_ENDPOINT ?? 'sms.tencentcloudapi.com',
    };
  }

  if (provider === 'aliyun') {
    return {
      provider: 'aliyun',
      enabled: Boolean(process.env.ALIYUN_SMS_ACCESS_KEY_ID && process.env.ALIYUN_SMS_ACCESS_KEY_SECRET && process.env.ALIYUN_SMS_SIGN_NAME && process.env.ALIYUN_SMS_TEMPLATE_CODE),
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
      signName: process.env.ALIYUN_SMS_SIGN_NAME,
      templateId: process.env.ALIYUN_SMS_TEMPLATE_CODE,
      region: process.env.ALIYUN_SMS_REGION ?? 'cn-hangzhou',
    };
  }

  return {
    provider: 'mock',
    enabled: false,
  };
}

export async function sendSms({ phone, code, purpose }: { phone: string; code: string; purpose: 'login' | 'register' }) {
  const normalizedPhone = normalizePhone(phone);

  if (!/^1\d{10}$/.test(normalizedPhone)) {
    throw new Error('请输入有效手机号');
  }

  const config = buildSmsConfig();

  if (config.provider === 'tencent' && config.enabled && config.secretId && config.secretKey && config.appId && config.signName && config.templateId) {
    try {
      const smsModule = await import('tencentcloud-sdk-nodejs/tencentcloud/services/sms');
      const TencentSmsClient = (smsModule as any).sms?.v20190711?.Client;

      if (!TencentSmsClient) {
        throw new Error('Tencent SMS client is unavailable');
      }

      const smsClient = new TencentSmsClient({
        credential: {
          secretId: config.secretId,
          secretKey: config.secretKey,
        },
        region: config.region ?? 'ap-guangzhou',
        profile: {
          signMethod: 'TC3-HMAC-SHA256',
          httpProfile: {
            endpoint: config.endpoint ?? 'sms.tencentcloudapi.com',
          },
        },
      });

      const action = await smsClient.SendSms({
        PhoneNumberSet: [`+86${normalizedPhone}`],
        SmsSdkAppId: config.appId,
        SignName: config.signName,
        TemplateId: config.templateId,
        TemplateParamSet: [JSON.stringify({ code, purpose: purpose === 'login' ? '登录' : '注册' })],
      });

      return {
        provider: 'tencent',
        ok: true,
        message: `验证码 ${code} 已通过腾讯云发送`,
        phone: normalizedPhone,
        debugCode: code,
        raw: action,
      };
    } catch (error) {
      console.error('Tencent SMS failed', error);
      throw new Error('短信发送失败：腾讯云配置异常或调用失败');
    }
  }

  if (config.provider === 'aliyun' && config.enabled) {
    try {
      const message = `【${config.signName}】您的${purpose === 'login' ? '登录' : '注册'}验证码是${code}。5分钟内有效。`;
      return {
        provider: 'aliyun',
        ok: true,
        message,
        phone: normalizedPhone,
      };
    } catch (error) {
      console.error('Aliyun SMS failed', error);
      throw new Error('短信发送失败');
    }
  }

  return {
    provider: 'mock',
    ok: true,
    message: `验证码 ${code} 已生成（开发环境模拟发送）`,
    phone: normalizedPhone,
    debugCode: code,
  };
}
