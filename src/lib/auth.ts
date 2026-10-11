export function normalizeUserRole(role?: string | null): string {
  const normalized = (role ?? '').trim();

  if (!normalized) return '用户';

  const normalizedLower = normalized.toLowerCase();

  if (normalized === '管理员' || normalizedLower === 'admin' || normalizedLower === 'administrator') {
    return '管理员';
  }

  const roleMap: Record<string, string> = {
    scientist: '科研人员',
    researcher: '科研人员',
    student: '学生',
    engineer: '工程师',
    teacher: '教师',
    operator: '操作员',
    analyst: '分析员',
    viewer: '访客',
    user: '用户',
    '科研人员': '科研人员',
    '工程师': '工程师',
    '学生': '学生',
    '教师': '教师',
    '操作员': '操作员',
    '分析员': '分析员',
    '访客': '访客',
    '用户': '用户',
  };

  return roleMap[normalizedLower] ?? roleMap[normalized] ?? '用户';
}

export function isAdminRole(role?: string | null): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === '管理员';
}

export function shouldAllowPasswordUpgrade(password?: string | null): boolean {
  return !password || password.trim().length === 0;
}

export function validateRegisterInput(input: {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  smsCode?: string;
}): string | null {
  const { name, email, password, phone, smsCode } = input;

  if (!name || !email || !password) {
    return '请输入用户名、邮箱和密码';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '邮箱格式不正确';
  }

  if ((password ?? '').length < 6) {
    return '密码至少需要 6 位字符';
  }

  if (phone) {
    if (!/^1\d{10}$/.test(phone.trim())) {
      return '手机号格式不正确';
    }

    if (!smsCode) {
      return '请输入短信验证码';
    }
  }

  return null;
}
