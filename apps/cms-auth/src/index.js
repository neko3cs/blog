// Sveltia CMS 用の GitHub OAuth の受け口（Issue #20）。
// 管理画面（/admin）から開いたポップアップで GitHub にログインさせ、アクセストークンを管理画面に渡す。
//
// 守っていること:
//   - ログインしたユーザー名が ALLOWED_USER のときだけ、トークンを渡す（他のユーザーのトークンは取り消す）
//   - トークンの権限は public_repo に固定する（管理画面からの scope の指定は無視する）
//   - トークンは、ALLOWED_ORIGINS にある管理画面にだけ postMessage で渡す
//   - state を Cookie と照らし合わせ、他人が始めたログインの戻りを受け付けない
//
// 環境変数: GITHUB_CLIENT_ID・GITHUB_CLIENT_SECRET（Secret）、ALLOWED_USER・ALLOWED_ORIGINS（wrangler.jsonc の vars）

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_API_VERSION = '2022-11-28';
const SCOPE = 'public_repo';
const PROVIDER = 'github';
const STATE_COOKIE = '__Host-cms-auth-state';
const USER_AGENT = 'neko3cs-blog-cms-auth';

/** @param {string} value */
const parseList = (value) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** HTML の <script> に埋め込める JSON にする */
const toScriptJson = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function text(status, body) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS },
  });
}

function clearStateCookie() {
  return `${STATE_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`;
}

/**
 * ポップアップに返す HTML。管理画面から 'authorizing:github' が届いたら、結果を管理画面に返す。
 * @param {'success' | 'error'} status
 * @param {object} content
 * @param {string[]} allowedOrigins
 */
function resultPage(status, content, allowedOrigins) {
  const nonce = btoa(crypto.randomUUID());
  const message = `authorization:${PROVIDER}:${status}:${JSON.stringify(content)}`;
  const label = status === 'success' ? 'ログインしました。このウィンドウは自動で閉じます。' : 'ログインできませんでした。このウィンドウを閉じてください。';
  const html = `<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${status === 'success' ? 'ログイン' : 'ログインできません'}</title>
<p>${label}</p>
<script nonce="${nonce}">
  (() => {
    const allowedOrigins = ${toScriptJson(allowedOrigins)};
    const message = ${toScriptJson(message)};
    window.addEventListener('message', (event) => {
      if (event.data === 'authorizing:${PROVIDER}' && allowedOrigins.includes(event.origin)) {
        window.opener?.postMessage(message, event.origin);
      }
    });
    window.opener?.postMessage('authorizing:${PROVIDER}', '*');
  })();
</script>
</html>`;
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
    ...SECURITY_HEADERS,
  });
  headers.append('Set-Cookie', clearStateCookie());
  return new Response(html, { status: status === 'success' ? 200 : 403, headers });
}

const errorPage = (error, allowedOrigins) => resultPage('error', { error }, allowedOrigins);

/** GitHub に、このアプリへのログインを始めさせる */
function handleAuth(url, env, allowedOrigins) {
  if (url.searchParams.get('provider') !== PROVIDER) {
    return text(400, 'provider が正しくありません');
  }
  // 管理画面のホスト名（Sveltia CMS が site_id として付ける）が、許可したものかを確かめる
  const siteId = url.searchParams.get('site_id') ?? '';
  if (!allowedOrigins.some((origin) => new URL(origin).hostname === siteId)) {
    return text(400, 'site_id が許可されていません');
  }

  const state = crypto.randomUUID();
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/callback`,
    // 管理画面から scope を指定されても、権限を広げない
    scope: SCOPE,
    state,
    allow_signup: 'false',
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax`,
      ...SECURITY_HEADERS,
    },
  });
}

/** GitHub から戻ってきたとき。トークンに交換して、許可したユーザーだけに渡す */
async function handleCallback(request, url, env, allowedOrigins, fetchImpl) {
  const cookieState = request.headers
    .get('Cookie')
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === STATE_COOKIE)?.[1];
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!cookieState || !state || cookieState !== state) {
    return errorPage('state が一致しません。もう一度ログインを始めてください', allowedOrigins);
  }
  if (!code) {
    return errorPage(url.searchParams.get('error_description') ?? 'GitHub の認可が得られませんでした', allowedOrigins);
  }

  const tokenResponse = await fetchImpl(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });
  const { access_token: token } = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !token) {
    return errorPage('GitHub のトークンを取得できませんでした', allowedOrigins);
  }

  const userResponse = await fetchImpl(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      'User-Agent': USER_AGENT,
    },
  });
  const { login } = await userResponse.json().catch(() => ({}));
  if (!userResponse.ok || typeof login !== 'string') {
    await revokeToken(token, env, fetchImpl);
    return errorPage('GitHub のユーザーを確認できませんでした', allowedOrigins);
  }
  if (login.toLowerCase() !== env.ALLOWED_USER.toLowerCase()) {
    // 許可していないユーザーのトークンは、渡さずに取り消す
    await revokeToken(token, env, fetchImpl);
    return errorPage('このアカウントは許可されていません', allowedOrigins);
  }

  return resultPage('success', { token, provider: PROVIDER }, allowedOrigins);
}

/** 渡さないトークンを GitHub 側で取り消す（失敗しても、ログインの結果は変えない） */
async function revokeToken(token, env, fetchImpl) {
  try {
    await fetchImpl(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({ access_token: token }),
    });
  } catch {
    // 取り消せなくても、トークンは誰にも渡していない
  }
}

/**
 * @param {Request} request
 * @param {Record<string, string>} env
 * @param {typeof fetch} fetchImpl テストで差し替えるため
 */
export async function handleRequest(request, env, fetchImpl = fetch) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.ALLOWED_USER || !env.ALLOWED_ORIGINS) {
    return text(500, '設定が足りません（GITHUB_CLIENT_ID・GITHUB_CLIENT_SECRET・ALLOWED_USER・ALLOWED_ORIGINS）');
  }
  if (request.method !== 'GET') {
    return text(405, 'Method Not Allowed');
  }

  const url = new URL(request.url);
  const allowedOrigins = parseList(env.ALLOWED_ORIGINS);
  switch (url.pathname) {
    case '/auth':
      return handleAuth(url, env, allowedOrigins);
    case '/callback':
      return handleCallback(request, url, env, allowedOrigins, fetchImpl);
    default:
      return text(404, 'Not Found');
  }
}

export default { fetch: (request, env) => handleRequest(request, env) };
