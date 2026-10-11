import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { shouldAllowPasswordUpgrade } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, identifier, password, phone, code } = body ?? {};
    const loginKey = email || identifier;

    if (loginKey && password) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: loginKey },
            { name: loginKey },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
        },
      });

      if (!user) return NextResponse.json({ error: '用户不存在或账号错误' }, { status: 401 });

      if (!user.password) {
        if (!shouldAllowPasswordUpgrade(user.password)) {
          return NextResponse.json({ error: '该用户尚未设置密码' }, { status: 401 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            lastActiveAt: new Date(),
          },
        });
      } else {
        const match = await bcrypt.compare(password, user.password);
        if (!match) return NextResponse.json({ error: '密码错误' }, { status: 401 });

        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });
      }

      const response = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      response.cookies.set('user', JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      await createAuditLog(user.id, 'user_login', `User signed in via password login (${user.email})`);
      return response;
    }

    if (phone && code) {
      const sms = await prisma.smsCode.findFirst({
        where: {
          phone,
          purpose: 'login',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!sms) {
        return NextResponse.json({ error: '验证码无效或已过期' }, { status: 401 });
      }

      const matchCode = await bcrypt.compare(code, sms.code);
      if (!matchCode) {
        return NextResponse.json({ error: '验证码错误' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return NextResponse.json({ error: '手机号未注册' }, { status: 401 });
      }

      await prisma.smsCode.deleteMany({ where: { phone, purpose: 'login' } });
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });

      const response = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      response.cookies.set('user', JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      await createAuditLog(user.id, 'user_login', `User signed in via SMS login (${user.email})`);
      return response;
    }

    return NextResponse.json({ error: '无效的请求' }, { status: 400 });
  } catch (err) {
    console.error('login error', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
