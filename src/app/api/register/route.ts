import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { normalizeUserRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, department, phone, code } = body ?? {};

    if (!name || !email || !password) {
      return NextResponse.json({ error: '请填写用户名、邮箱和密码' }, { status: 400 });
    }

    if (phone) {
      const sms = await prisma.smsCode.findFirst({
        where: {
          phone,
          purpose: 'register',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!sms) {
        return NextResponse.json({ error: '验证码无效或已过期' }, { status: 401 });
      }

      const validCode = await bcrypt.compare(code ?? '', sms.code);
      if (!validCode) {
        return NextResponse.json({ error: '验证码错误' }, { status: 401 });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
    }

    if (phone) {
      const phoneExists = await prisma.user.findFirst({ where: { phone } });
      if (phoneExists) {
        return NextResponse.json({ error: '该手机号已被注册' }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        initials: initials || 'N/A',
        role: normalizeUserRole(role),
        department: department || '未知单位',
        status: 'Active',
      },
    });

    if (phone) {
      await prisma.smsCode.deleteMany({ where: { phone, purpose: 'register' } });
    }

    await createAuditLog(user.id, 'user_registered', `Registered account for ${user.name} (${user.email})`);

    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('register error', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
