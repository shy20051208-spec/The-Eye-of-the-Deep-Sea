import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSmsConfig, generateVerificationCode, normalizePhone } from './sms';

test('normalizePhone keeps a valid mobile number', () => {
  assert.equal(normalizePhone('13800138000'), '13800138000');
  assert.equal(normalizePhone('+86 13800138000'), '13800138000');
});

test('generateVerificationCode returns a 6-digit code', () => {
  const code = generateVerificationCode();
  assert.equal(code.length, 6);
  assert.match(code, /^\d{6}$/);
});

test('buildSmsConfig uses mock mode when no provider is configured', () => {
  process.env.SMS_PROVIDER = '';
  const config = buildSmsConfig();
  assert.equal(config.provider, 'mock');
  assert.equal(config.enabled, false);
});
