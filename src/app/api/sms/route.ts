import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateVerificationCode, normalizePhone, sendSms } from '@/lib/sms';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, purpose } = body ?? {};

    if (!phone || !purpose || (purpose !== 'login' && purpose !== 'register')) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!/^1\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: '请输入有效手机号' }, { status: 400 });
    }

    const code = generateVerificationCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.smsCode.create({
      data: {
        phone: normalizedPhone,
        code: hashedCode,
        purpose,
        expiresAt,
      },
    });

    const providerResult = await sendSms({ phone: normalizedPhone, code, purpose });

    return NextResponse.json({
      success: true,
      provider: providerResult.provider,
      debug: providerResult.debugCode ?? undefined,
      message: providerResult.message,
    });
  } catch (err) {
    console.error('sms send error', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : '服务器错误' }, { status: 500 });
  }
}
