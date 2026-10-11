import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  // 未登录时，访问非登录/非API页面，跳转到登录页
  if (!token && !pathname.startsWith('/login') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};