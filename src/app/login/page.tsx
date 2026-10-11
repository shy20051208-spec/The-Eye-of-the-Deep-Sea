'use client';

import { useState, useEffect, useRef, type CSSProperties, type ChangeEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeUserRole, validateRegisterInput } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [loginType, setLoginType] = useState('password'); // password | sms
  const [rememberPwd, setRememberPwd] = useState(false);
  const [identifier, setIdentifier] = useState(''); // 邮箱/用户名 或 手机号
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginSmsCode, setLoginSmsCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSmsSending, setLoginSmsSending] = useState(false);
  const [loginSmsCountdown, setLoginSmsCountdown] = useState(0);
  const [loginSmsMessage, setLoginSmsMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerSmsCode, setRegisterSmsCode] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerCountry, setRegisterCountry] = useState('');
  const [registerGender, setRegisterGender] = useState('保密');
  const [registerError, setRegisterError] = useState('');
  const [registerAge, setRegisterAge] = useState('');
  const [registerCareer, setRegisterCareer] = useState('');
  const [registerCompany, setRegisterCompany] = useState('');
  const [registerSmsSending, setRegisterSmsSending] = useState(false);
  const [registerSmsCountdown, setRegisterSmsCountdown] = useState(0);
  const [registerSmsMessage, setRegisterSmsMessage] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isValidPhone = (value: string) => /^1\d{10}$/.test(value.trim());
  const isStrongPassword = (value: string) => value.length >= 6;

  useEffect(() => {
    const userCookie = document.cookie.match(/(?:^|; )user=([^;]+)/);
    if (userCookie) {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('deepsea-remembered-user');
      if (!stored) return;
      const parsed = JSON.parse(stored) as { identifier?: string; password?: string };
      if (parsed.identifier) {
        setIdentifier(parsed.identifier);
      }
      if (parsed.password) {
        setPassword(parsed.password);
        setRememberPwd(true);
      }
    } catch {
      localStorage.removeItem('deepsea-remembered-user');
    }
  }, []);

  useEffect(() => {
    if (!loginSmsCountdown) return;
    const timer = window.setInterval(() => {
      setLoginSmsCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loginSmsCountdown]);

  useEffect(() => {
    if (!registerSmsCountdown) return;
    const timer = window.setInterval(() => {
      setRegisterSmsCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [registerSmsCountdown]);

  const persistRememberedLogin = (nextRemember: boolean) => {
    if (!nextRemember) {
      localStorage.removeItem('deepsea-remembered-user');
      return;
    }
    localStorage.setItem(
      'deepsea-remembered-user',
      JSON.stringify({ identifier, password })
    );
  };

  const sendSmsCode = async (purpose: 'login' | 'register') => {
    const phone = purpose === 'login' ? loginPhone : registerPhone;
    if (!phone) {
      alert('请输入手机号');
      return;
    }

    if (!isValidPhone(phone)) {
      alert('手机号格式不正确');
      return;
    }

    const setMessage = purpose === 'login' ? setLoginSmsMessage : setRegisterSmsMessage;
    const setSending = purpose === 'login' ? setLoginSmsSending : setRegisterSmsSending;
    const setCountdown = purpose === 'login' ? setLoginSmsCountdown : setRegisterSmsCountdown;

    setMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || '短信发送失败');
        return;
      }

      setMessage('验证码已发送，请注意查收。');
      setCountdown(60);
      if (data?.debug) console.info('SMS code:', data.debug);
    } catch (err) {
      console.error(err);
      alert('短信发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  // 动态深海背景（同上，省略）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const context = ctx as CanvasRenderingContext2D;

    let canvasWidth = canvas.width;
    let canvasHeight = canvas.height;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      constructor() {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvasWidth) this.x = 0;
        if (this.x < 0) this.x = canvasWidth;
        if (this.y > canvasHeight) this.y = 0;
        if (this.y < 0) this.y = canvasHeight;
      }
      draw() {
        context.fillStyle = `rgba(100, 181, 246, ${this.opacity})`;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
      }
    }

    const particlesArray: Particle[] = [];
    for (let i = 0; i < 100; i++) particlesArray.push(new Particle());

    let time = 0;
    const animate = () => {
      if (!ctx) return;
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#011627');
      gradient.addColorStop(0.5, '#051a2d');
      gradient.addColorStop(1, '#0a3d62');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      time += 0.01;
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 5) {
          const wave = Math.sin(x * 0.01 + time + y * 0.005) * 10;
          ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }

      particlesArray.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    };
    animate();

    return () => window.removeEventListener('resize', setCanvasSize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(56, 152, 255, 0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(24, 85, 139, 0.22), transparent 28%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '960px', width: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: '28px', boxShadow: '0 32px 120px rgba(0,0,0,0.24)', overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '320px', background: 'linear-gradient(180deg, rgba(7, 36, 68, 0.98) 0%, rgba(10, 61, 98, 0.95) 100%)', color: '#fff', padding: '48px 38px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '16px', background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center' }}>
                  <span style={{ fontSize: '22px' }}>🌊</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>深渊之眼</h2>
                  <p style={{ margin: '8px 0 0', opacity: 0.86, fontSize: '14px' }}>CTD 温盐深观测分析平台</p>
                </div>
              </div>
              <div style={{ marginTop: '36px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>海洋知识检索</h3>
                <input placeholder="输入关键词：温跃层、盐度、南海…" style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.18)', marginTop: '16px', background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }} />
              </div>
            </div>
            <div style={{ marginTop: '42px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>最新科研动态</h3>
              <div style={{ marginTop: '18px', fontSize: '14px', lineHeight: '26px', opacity: 0.9 }}>
                <div>• 南海温跃层监测报告发布</div>
                <div>• GOOS 海洋观测标准更新</div>
                <div>• 中国大洋科考第45航次完成</div>
                <div>• 全球海水温度持续上升</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '340px', padding: '44px 36px', boxSizing: 'border-box', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'rgba(15, 59, 115, 0.06)', borderRadius: '16px', padding: '8px', border: '1px solid rgba(15, 59, 115, 0.08)' }}>
              <button onClick={() => setTab('login')} style={tabButtonStyle(tab === 'login')}>登录</button>
              <button onClick={() => setTab('register')} style={tabButtonStyle(tab === 'register')}>注册</button>
            </div>

            {tab === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loginType === 'password' ? (
                  <>
                    <input placeholder="邮箱/用户名" value={identifier} onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)} style={inputStyle} />
                    <div style={{ position: 'relative' }}>
                      <input placeholder="密码" type={showPassword ? 'text' : 'password'} value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '44px' }} />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#0a3d62', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        {showPassword ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#4b5563' }}>
                        <input type="checkbox" checked={rememberPwd} onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const next = e.target.checked;
                          setRememberPwd(next);
                          persistRememberedLogin(next);
                        }} style={{ accentColor: '#0a3d62' }} />记住密码
                      </label>
                      <a href="#" onClick={(e: MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); alert('请联系管理员重置密码'); }} style={{ color: '#0a3d62', textDecoration: 'none', fontWeight: 500 }}>忘记密码？</a>
                    </div>
                    {loginError ? <div style={{ color: '#b91c1c', fontSize: '13px' }}>{loginError}</div> : null}
                  </>
                ) : (
                  <>
                    <input placeholder="请输入手机号" value={loginPhone} onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginPhone(e.target.value)} style={inputStyle} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input placeholder="短信验证码" value={loginSmsCode} onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginSmsCode(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      <button type="button" onClick={() => sendSmsCode('login')} disabled={loginSmsSending || loginSmsCountdown > 0} style={{
                      ...smallButtonStyle,
                      background: loginSmsSending || loginSmsCountdown > 0 ? '#5b7ea9' : '#0a3d62',
                      cursor: loginSmsSending || loginSmsCountdown > 0 ? 'not-allowed' : 'pointer',
                    }}>
                      {loginSmsCountdown > 0 ? `${loginSmsCountdown}s 后重发` : loginSmsSending ? '发送中...' : '获取验证码'}
                    </button>
                    </div>
                    {loginSmsMessage ? <div style={{ fontSize: '13px', color: '#0a3d62', marginTop: '4px' }}>{loginSmsMessage}</div> : null}
                  </>
                )}

                <button onClick={async () => {
                  if (loading) return;
                  setLoginError('');
                  setLoading(true);
                  try {
                    let body: Record<string, unknown> = {};
                    if (loginType === 'password') {
                      if (!identifier || !password) {
                        setLoginError('请输入用户名与密码');
                        setLoading(false);
                        return;
                      }
                      if (!isStrongPassword(password)) {
                        setLoginError('密码至少需要 6 位字符');
                        setLoading(false);
                        return;
                      }
                      body = { email: identifier, password };
                    } else {
                      if (!loginPhone || !loginSmsCode) {
                        setLoginError('请输入手机号与验证码');
                        setLoading(false);
                        return;
                      }
                      if (!isValidPhone(loginPhone)) {
                        setLoginError('手机号格式不正确');
                        setLoading(false);
                        return;
                      }
                      body = { phone: loginPhone, code: loginSmsCode };
                    }

                    const res = await fetch('/api/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(body),
                    });

                    if (res.ok) {
                      if (loginType === 'password' && rememberPwd) {
                        persistRememberedLogin(true);
                      } else if (loginType === 'password' && !rememberPwd) {
                        localStorage.removeItem('deepsea-remembered-user');
                      }
                      window.location.href = '/';
                      return;
                    } else {
                      const data = await res.json().catch(() => ({}));
                      setLoginError(data?.error || '登录失败');
                    }
                  } catch (err) {
                    console.error(err);
                    setLoginError('网络错误，登录失败');
                  } finally {
                    setLoading(false);
                  }
                }} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>{loading ? '登录中...' : '登录系统'}</button>

                <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                  {loginType === 'password' ? (
                    <a href="#" onClick={(e: MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); setLoginType('sms'); }} style={{ color: '#0a3d62', textDecoration: 'none', fontWeight: 500 }}>使用手机号验证码登录</a>
                  ) : (
                    <a href="#" onClick={(e: MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); setLoginType('password'); }} style={{ color: '#0a3d62', textDecoration: 'none', fontWeight: 500 }}>返回密码登录</a>
                  )}
                </div>
              </div>
            )}

            {tab === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input placeholder="用户名" value={registerName} onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterName(e.target.value)} style={inputStyle} />
                <input placeholder="邮箱" type="email" value={registerEmail} onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterEmail(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="手机号" value={registerPhone} onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterPhone(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => sendSmsCode('register')}
                    disabled={registerSmsSending || registerSmsCountdown > 0}
                    style={{
                      ...smallButtonStyle,
                      background: registerSmsSending || registerSmsCountdown > 0 ? '#5b7ea9' : '#0a3d62',
                      cursor: registerSmsSending || registerSmsCountdown > 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {registerSmsCountdown > 0 ? `${registerSmsCountdown}s 后重发` : registerSmsSending ? '发送中...' : '获取验证码'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="短信验证码" value={registerSmsCode} onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterSmsCode(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
                {registerSmsMessage ? <div style={{ fontSize: '13px', color: '#0a3d62', marginTop: '4px' }}>{registerSmsMessage}</div> : null}
                <div style={{ position: 'relative' }}>
                  <input placeholder="设置密码" type={showRegisterPassword ? 'text' : 'password'} value={registerPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowRegisterPassword((value) => !value)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#0a3d62', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                    {showRegisterPassword ? '隐藏' : '显示'}
                  </button>
                </div>
                {registerError ? <div style={{ color: '#b91c1c', fontSize: '13px' }}>{registerError}</div> : null}
                <select value={registerCountry} onChange={(e: ChangeEvent<HTMLSelectElement>) => setRegisterCountry(e.target.value)} style={inputStyle}>
                  <option value="">国籍</option>
                  <option value="CN">中国</option>
                  <option value="US">美国</option>
                  <option value="Other">其他</option>
                </select>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', fontSize: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}><input type="radio" name="gender" checked={registerGender === '男'} onChange={() => setRegisterGender('男')} /> 男</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}><input type="radio" name="gender" checked={registerGender === '女'} onChange={() => setRegisterGender('女')} /> 女</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}><input type="radio" name="gender" checked={registerGender === '保密'} onChange={() => setRegisterGender('保密')} /> 保密</label>
                </div>
                <input placeholder="年龄" type="number" value={registerAge} onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterAge(e.target.value)} style={inputStyle} />
                <select value={registerCareer} onChange={(e: ChangeEvent<HTMLSelectElement>) => setRegisterCareer(e.target.value)} style={inputStyle}>
                  <option value="">职业</option>
                  <option value="scientist">海洋科研人员</option>
                  <option value="student">学生</option>
                  <option value="engineer">工程师</option>
                  <option value="other">其他</option>
                </select>
                <input placeholder="工作单位（选填）" value={registerCompany} onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterCompany(e.target.value)} style={inputStyle} />
                <button onClick={async () => {
                  if (registerLoading) return;
                  setRegisterError('');

                  const validationError = validateRegisterInput({
                    name: registerName,
                    email: registerEmail,
                    password: registerPassword,
                    phone: registerPhone,
                    smsCode: registerSmsCode,
                  });

                  if (validationError) {
                    setRegisterError(validationError);
                    return;
                  }

                  setRegisterLoading(true);
                  setRegisterMessage('');
                  try {
                    const res = await fetch('/api/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: registerName,
                        email: registerEmail,
                        phone: registerPhone || undefined,
                        code: registerSmsCode || undefined,
                        password: registerPassword,
                        role: normalizeUserRole(registerCareer),
                        department: registerCompany || '未知单位',
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      const loginRes = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
                      });
                      if (loginRes.ok) {
                        window.location.href = '/';
                        return;
                      }
                      setRegisterMessage('注册成功，请登录。');
                      setTab('login');
                      setIdentifier(registerEmail);
                      setPassword('');
                    } else {
                      setRegisterError(data?.error || '注册失败');
                    }
                  } catch (err) {
                    console.error(err);
                    setRegisterError('网络错误，注册失败');
                  } finally {
                    setRegisterLoading(false);
                  }
                }} style={{ ...buttonStyle, opacity: registerLoading ? 0.7 : 1 }}>{registerLoading ? '注册中...' : '完成注册'}</button>
                {registerMessage ? <div style={{ color: '#0a3d62', marginTop: '8px' }}>{registerMessage}</div> : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const tabButtonStyle = (active: boolean) => ({
  flex: 1,
  borderRadius: '14px',
  border: 'none',
  padding: '14px 0',
  fontSize: '15px',
  cursor: 'pointer',
  fontWeight: 700,
  background: active ? '#0a3d62' : 'transparent',
  color: active ? '#fff' : '#5c6a85',
  transition: 'all 0.2s ease',
})
 ;

const inputStyle: CSSProperties = {
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  fontSize: '15px',
  width: '100%',
  boxSizing: 'border-box',
  background: '#f8fbff',
  color: '#15212b',
  outline: 'none',
  boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.05)',
};

const buttonStyle: CSSProperties = {
  padding: '14px',
  borderRadius: '14px',
  border: 'none',
  background: 'linear-gradient(135deg, #0f4f8f, #0a3d62)',
  color: 'white',
  fontSize: '16px',
  cursor: 'pointer',
  width: '100%',
  marginTop: '10px',
  fontWeight: 700,
  transition: 'opacity 0.2s ease, transform 0.2s ease',
};

const smallButtonStyle: CSSProperties = {
  padding: '0 16px',
  borderRadius: '12px',
  border: 'none',
  background: '#0a3d62',
  color: '#fff',
  fontSize: '13px',
  cursor: 'pointer',
  minWidth: '110px',
};