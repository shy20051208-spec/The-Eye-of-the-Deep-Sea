import test from 'node:test';
import assert from 'node:assert/strict';

import { isAdminRole, normalizeUserRole, shouldAllowPasswordUpgrade, validateRegisterInput } from './auth';

test('normalizeUserRole maps occupational choices to app roles', () => {
  assert.equal(normalizeUserRole('scientist'), '科研人员');
  assert.equal(normalizeUserRole('student'), '学生');
  assert.equal(normalizeUserRole('engineer'), '工程师');
  assert.equal(normalizeUserRole('other'), '用户');
  assert.equal(normalizeUserRole(''), '用户');
  assert.equal(normalizeUserRole('管理员'), '管理员');
});

test('isAdminRole recognizes normalized admin labels', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('管理员'), true);
  assert.equal(isAdminRole('科研人员'), false);
});

test('validateRegisterInput validates optional phone verification correctly', () => {
  assert.equal(validateRegisterInput({
    name: 'Alice',
    email: 'alice@example.com',
    password: '123456',
    phone: '',
    smsCode: '',
  }), null);

  assert.match(
    validateRegisterInput({
      name: 'Alice',
      email: 'alice@example.com',
      password: '123456',
      phone: '13800138000',
      smsCode: '',
    }) ?? '',
    /验证码/
  );

  assert.match(
    validateRegisterInput({
      name: 'Alice',
      email: 'alice@example.com',
      password: '123456',
      phone: '123',
      smsCode: '123456',
    }) ?? '',
    /手机号格式/
  );
});

test('legacy users without a stored password can be upgraded during login', () => {
  assert.equal(shouldAllowPasswordUpgrade(null), true);
  assert.equal(shouldAllowPasswordUpgrade(''), true);
  assert.equal(shouldAllowPasswordUpgrade('$2a$10$hashed.value'), false);
});
