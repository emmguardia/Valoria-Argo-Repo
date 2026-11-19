import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import { clientIp } from '../src/utils/http.js';
import { userJson } from '../src/services/users.js';
import type { UserRow } from '../src/services/users.js';

const req = (headers: Record<string, string>, ip = '10.42.0.7') =>
  ({ ip, get: (name: string) => headers[name.toLowerCase()] }) as unknown as Request;

test('clientIp prend l\'IP donnée par Cloudflare, pas celle du pod cloudflared', () => {
  assert.equal(clientIp(req({ 'cf-connecting-ip': '203.0.113.9' })), '203.0.113.9');
  assert.equal(clientIp(req({})), '10.42.0.7');
});

test('userJson : rôle inconnu ramené à user, liaison et e-mail en booléens', () => {
  const json = userJson({
    id: 7, pseudo: 'Nanozo', email: 'a@b.fr', ecus: null, role: 'superadmin', mc_uuid: 'x',
    email_verified_at: null, banned_at: null, created_at: new Date(0), last_login: null,
  } as UserRow);
  assert.equal(json.id, '7');
  assert.equal(json.role, 'user');
  assert.equal(json.ecus, 0);
  assert.equal(json.linked, true);
  assert.equal(json.emailVerified, false);
});
