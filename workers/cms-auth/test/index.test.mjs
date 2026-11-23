import assert from 'node:assert/strict';
import { test } from 'node:test';

import { handleRequest } from '../src/index.js';

const ENV = {
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'client-secret',
  ALLOWED_USER: 'neko3cs',
  ALLOWED_ORIGINS: 'https://blog.neko3cs.net',
};
const BASE = 'https://cms-auth.example.workers.dev';
const TOKEN = 'gho_secrettoken';

/** GitHub の応答を差し替えた fetch。呼ばれたリクエストを calls に残す */
function fakeGitHub({ login = 'neko3cs', tokenOk = true, userOk = true } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).startsWith('https://github.com/login/oauth/access_token')) {
      return Response.json(tokenOk ? { access_token: TOKEN } : { error: 'bad_verification_code' }, );
    }
    if (String(url) === 'https://api.github.com/user') {
      return userOk ? Response.json({ login }) : new Response('{}', { status: 401 });
    }
    return new Response('{}', { status: 204 });
  };
  return { fetchImpl, calls };
}

const stateOf = (response) => response.headers.get('Set-Cookie').match(/__Host-cms-auth-state=([^;]+)/)[1];

async function startLogin(query = 'provider=github&site_id=blog.neko3cs.net&scope=repo') {
  return handleRequest(new Request(`${BASE}/auth?${query}`), ENV);
}

function callbackRequest(state, { cookieState = state, code = 'the-code' } = {}) {
  const params = new URLSearchParams({ state });
  if (code) params.set('code', code);
  return new Request(`${BASE}/callback?${params}`, {
    headers: cookieState ? { Cookie: `__Host-cms-auth-state=${cookieState}` } : {},
  });
}

test('/auth は、管理画面が scope=repo を求めても public_repo で GitHub に渡す', async () => {
  const response = await startLogin();
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get('Location'));
  assert.equal(location.origin + location.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(location.searchParams.get('scope'), 'public_repo');
  assert.equal(location.searchParams.get('client_id'), 'client-id');
  assert.equal(location.searchParams.get('redirect_uri'), `${BASE}/callback`);
  assert.equal(location.searchParams.get('state'), stateOf(response));
  assert.match(response.headers.get('Set-Cookie'), /Secure; HttpOnly; SameSite=Lax/);
});

test('/auth は、許可していない site_id と provider を断る', async () => {
  assert.equal((await startLogin('provider=github&site_id=evil.example.com')).status, 400);
  assert.equal((await startLogin('provider=gitlab&site_id=blog.neko3cs.net')).status, 400);
  assert.equal((await startLogin('')).status, 400);
});

test('許可したユーザーには、トークンを管理画面だけに渡す HTML を返す', async () => {
  const state = stateOf(await startLogin());
  const { fetchImpl } = fakeGitHub();
  const response = await handleRequest(callbackRequest(state), ENV, fetchImpl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.ok(html.includes(TOKEN));
  assert.ok(html.includes('authorization:github:success:'));
  assert.ok(html.includes('allowedOrigins.includes(event.origin)'));
  assert.ok(html.includes('"https://blog.neko3cs.net"'));
  assert.match(response.headers.get('Content-Security-Policy'), /script-src 'nonce-/);
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
});

test('ユーザー名の大文字小文字は区別しない', async () => {
  const state = stateOf(await startLogin());
  const { fetchImpl } = fakeGitHub({ login: 'Neko3CS' });
  const response = await handleRequest(callbackRequest(state), ENV, fetchImpl);
  assert.equal(response.status, 200);
});

test('許可していないユーザーには、トークンを渡さず、GitHub 側で取り消す', async () => {
  const state = stateOf(await startLogin());
  const { fetchImpl, calls } = fakeGitHub({ login: 'someone-else' });
  const response = await handleRequest(callbackRequest(state), ENV, fetchImpl);
  const html = await response.text();

  assert.equal(response.status, 403);
  assert.ok(!html.includes(TOKEN));
  assert.ok(html.includes('authorization:github:error:'));
  const revoke = calls.find((call) => call.url === 'https://api.github.com/applications/client-id/token');
  assert.equal(revoke?.init.method, 'DELETE');
  assert.ok(String(revoke?.init.body).includes(TOKEN));
});

test('state が Cookie と合わないときは、GitHub に問い合わせない', async () => {
  const state = stateOf(await startLogin());
  const { fetchImpl, calls } = fakeGitHub();
  for (const request of [
    callbackRequest(state, { cookieState: 'another-state' }),
    callbackRequest(state, { cookieState: '' }),
  ]) {
    const response = await handleRequest(request, ENV, fetchImpl);
    assert.equal(response.status, 403);
    assert.ok(!(await response.text()).includes(TOKEN));
  }
  assert.equal(calls.length, 0);
});

test('code がない、またはトークンを取得できないときは、エラーを返す', async () => {
  const state = stateOf(await startLogin());
  const noCode = await handleRequest(callbackRequest(state, { code: '' }), ENV, fakeGitHub().fetchImpl);
  assert.equal(noCode.status, 403);

  const badToken = await handleRequest(callbackRequest(state), ENV, fakeGitHub({ tokenOk: false }).fetchImpl);
  assert.equal(badToken.status, 403);
  assert.ok((await badToken.text()).includes('authorization:github:error:'));
});

test('ユーザーを確認できないときは、トークンを渡さずに取り消す', async () => {
  const state = stateOf(await startLogin());
  const { fetchImpl, calls } = fakeGitHub({ userOk: false });
  const response = await handleRequest(callbackRequest(state), ENV, fetchImpl);
  assert.equal(response.status, 403);
  assert.ok(!(await response.text()).includes(TOKEN));
  assert.ok(calls.some((call) => call.init.method === 'DELETE'));
});

test('設定が足りないとき、GET 以外、知らないパスは断る', async () => {
  assert.equal((await handleRequest(new Request(`${BASE}/auth`), { ...ENV, ALLOWED_USER: '' })).status, 500);
  assert.equal((await handleRequest(new Request(`${BASE}/auth`, { method: 'POST' }), ENV)).status, 405);
  assert.equal((await handleRequest(new Request(`${BASE}/other`), ENV)).status, 404);
});
