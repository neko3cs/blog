# 失ったときの作り直し（復旧）の手順書

Cloudflare や GitHub の設定を失ったとき（誤って消した、アカウントの問題、別のアカウントで作り直すなど）に、この手順書を見て元の環境を作り直すためのものです（Issue #24）。

Terraform などの IaC は使っていません。今の規模では、管理の手間のほうが大きいためです。代わりに、この手順書と、設定の書き出し（`docs/recovery/`）で補います。リソースが増える、複数のサイトで同じ構成を作る、他の人と共同で変更する、といった状況になったら、IaC を再検討します。

## 1. 何が Git にあり、何がないか

| もの | 置き場所 | 失ったとき |
| --- | --- | --- |
| 記事、画像、サイトのコード | Git | `git clone` で戻る |
| Worker の設定（`apps/*/wrangler.jsonc`）、デプロイの手順（`.github/workflows/deploy.yml`） | Git | 同上 |
| 管理画面の設定（`apps/blog/public/admin/`） | Git | 同上 |
| 動いている Worker のバージョン | Cloudflare | バージョン履歴から戻せる（2.2） |
| DNS のレコード | Cloudflare（書き出しは `docs/recovery/`。**未了**、下記の注意を参照） | 作り直す（3.2） |
| Cloudflare の API トークン | Cloudflare | 作り直す（3.3） |
| `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` | GitHub の Secrets | 値は読み出せない。作り直して登録し直す（3.4） |
| `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` | 受け口 Worker のシークレット | 値は読み出せない。OAuth App から取り直して登録し直す（3.5） |
| GitHub の OAuth App | GitHub | 作り直す（3.5） |
| `main` のルールセット | GitHub（書き出しは `docs/recovery/ruleset-main.json`） | 書き出しから作り直す（3.6） |

> **未了（DNS の書き出し）:** DNS のレコードの書き出しは、`blog` の CNAME の片付け（#14）が終わってから置きます。今は `hatenablog.com` を向いた CNAME が残っており、途中の状態を正として残さないためです。置くまでは、3.2 の表を正とします。置いたら、この注意を消してください。

### シークレットの値の保管

読み出せない値は、パスワードマネージャーに入れておきます。値そのものは、リポジトリに置きません。

- Cloudflare のアカウント ID（秘密ではないが、控えておく）
- Cloudflare の API トークン（作ったときに1度だけ表示される）
- GitHub の OAuth App の Client ID と Client secret

## 2. 戻し方（作り直さずに戻せるもの）

### 2.1 誤った記事の保存を戻す

管理画面から保存した記事は、`main` へのコミットです。戻すときは、そのコミットを `git revert` します。`main` は PR 必須ですが、管理者は例外にしてあるので、直接 push できます（3.6）。

```bash
git revert <コミットのハッシュ>
git push origin main
```

push すると、自動でデプロイされます（1〜2分）。

### 2.2 デプロイした Worker の動作を戻す

どちらかの方法で、1つ前のバージョンに戻せます。

- **Cloudflare のダッシュボード:** Workers & Pages → 対象の Worker → デプロイメント → 戻したいバージョンの「…」→ ロールバック
- **wrangler:** `apps/blog` の Worker は `blog`、ログインの受け口は `cms-auth` で実行します。

  ```bash
  pnpm --filter blog exec wrangler deployments list
  pnpm --filter blog exec wrangler rollback
  ```

  ```bash
  pnpm --filter cms-auth exec wrangler deployments list
  pnpm --filter cms-auth exec wrangler rollback
  ```

  `wrangler rollback` に、バージョンの ID を渡すと、そのバージョンに戻せます。手元から実行するときは、`wrangler login` か、`CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` の環境変数が必要です。

**注意:** ロールバックしても、Git の `main` は変わりません。次に `main` へ push すると、また壊れた版がデプロイされます。原因のコミットを `git revert` して、`main` と Worker をそろえてください。

## 3. 作り直す手順

Cloudflare と GitHub の設定をすべて失った場合の手順です。作った順に書いています。一部だけ失った場合は、該当の節だけ実行します。

### 3.0 準備

- リポジトリを手元に clone し、`pnpm install` する（pnpm 11、Node 26。`.github/workflows/deploy.yml` と同じ）
- `gh`（GitHub CLI）に、`gh auth login` でログインしておく
- 別のアカウントで作り直すときは、先に「4. 別のアカウントで作り直すときに書き換える場所」を読む

### 3.1 Cloudflare にサイトを入れる

`neko3cs.net` のゾーンが Cloudflare に残っていれば、この節は飛ばします。

1. Cloudflare のダッシュボード → Add a domain で `neko3cs.net` を追加する
2. 表示されたネームサーバーを、ドメインのレジストラで設定する
3. ゾーンが有効（Active）になるまで待つ

### 3.2 DNS のレコード

Cloudflare のダッシュボード → `neko3cs.net` → DNS → Records で、書き出しがあれば、Import で取り込みます。書き出しは、同じ画面の Export（BIND 形式）で作ります（作り方は 5）。

書き出しがまだないあいだは、次の表を正として、手で作ります。

| 種類 | 名前 | 向き先 | プロキシ | 備考 |
| --- | --- | --- | --- | --- |
| CNAME | `blog` | `hatenablog.com` | オン | #14 が終わるまでの状態。プロキシをオンにしたこのレコードに、Worker のルート `blog.neko3cs.net/*` が掛かる |

`nslookup -type=TXT neko3cs.net` で確認できた、ルート（`neko3cs.net`）の TXT レコードは次の3つです（2026-11-24 時点。公開されている値です）。

| 種類 | 名前 | 内容 | 用途 |
| --- | --- | --- | --- |
| TXT | `neko3cs.net` | `v=spf1 -all` | このドメインからはメールを送らない（SPF） |
| TXT | `neko3cs.net` | `google-site-verification=OxRcB5XmaSQ8_UyO6AA3Ngv_od8ARPTGaKrbaLNUPmk` | Search Console の「ドメイン」プロパティの所有権確認 |
| TXT | `neko3cs.net` | `openai-domain-verification=dv-IMMDPC9OWgFSTzs9HQyYQ6FK` | OpenAI のドメイン確認 |

このほかに、ポートフォリオサイトなどのレコードもあります。この表は、問い合わせで分かった範囲だけです。レコードの一覧は、Cloudflare の画面か API でないと分からないので、書き出しができたら、そちらを正にします。Search Console の TXT は、「ドメイン」プロパティの所有権の確認で、新しい値が表示されることもあります。

> `blog` のレコードのプロキシがオフだと、Worker のルートが効きません。作り直したあとは、オレンジの雲（プロキシ オン）になっているかを確かめます。

### 3.3 Cloudflare の API トークン

GitHub Actions が、Worker をデプロイするためのトークンです。

1. Cloudflare のダッシュボード → My Profile → API Tokens → Create Token
2. テンプレート「Edit Cloudflare Workers」を選ぶ
3. **権限を絞る。**
   - Account Resources: `neko3cs` のアカウントだけ（All accounts にしない）
   - Zone Resources: `neko3cs.net` だけ（All zones にしない）
   - User の権限（User Details、Memberships など）は付けない。`CLOUDFLARE_ACCOUNT_ID` を渡すので、デプロイには要らない。外してデプロイが通らなければ、エラーに出る権限だけを足す
4. 作ったトークンを、パスワードマネージャーに入れる（表示されるのは1回だけ）
5. アカウント ID を控える（Workers & Pages の画面の右側に出る）

### 3.4 GitHub の Secrets

リポジトリのルートで実行します。コマンドの実行中に、値を入力します。

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

### 3.5 GitHub の OAuth App と、Worker のシークレット

管理画面（`/admin/`）の GitHub ログインに使います。

1. GitHub の Settings → Developer settings → OAuth Apps → New OAuth App で、次のように入れる。
   - Application name: 任意（例: `neko3cs blog cms`）
   - Homepage URL: `https://blog.neko3cs.net`
   - Authorization callback URL: `https://neko3cs-blog-cms-auth.neko3cs.workers.dev/callback`

   Redirect URI（callback URL）は、受け口の Worker の URL に `/callback` を足したものです。ここが違うと、ログインで `redirect_uri` のエラーになります。
2. 作ったら、Client ID を控え、「Generate a new client secret」で Client secret を作って控える。パスワードマネージャーに入れる。
3. **Worker を先にデプロイする。** シークレットは、Worker があるところに登録します。GitHub の Actions → Deploy → Run workflow で、`main` からデプロイする（3.4 までが済んでいること）。
4. 受け口の Worker にシークレットを登録する（コマンドの実行中に、値を入力する）。

   ```bash
   pnpm --filter cms-auth exec wrangler secret put GITHUB_CLIENT_ID
   ```

   ```bash
   pnpm --filter cms-auth exec wrangler secret put GITHUB_CLIENT_SECRET
   ```

   手元から実行するには、`wrangler login` か、`CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` の環境変数が必要です。
5. 権限の確認: ログインしたトークンの権限は、コードで `public_repo` に固定しています（`apps/cms-auth/src/index.js`）。OAuth App 側で設定する項目はありません。ログインできるのは `neko3cs` だけで、`apps/cms-auth/wrangler.jsonc` の `ALLOWED_USER` と `ALLOWED_ORIGINS` で決まります。

### 3.6 `main` のルールセット

`main` を「PR 必須・削除と強制 push の禁止」にし、管理者（Repository admin）だけを例外にします。例外がないと、管理画面から直接コミットできません。設定は `docs/recovery/ruleset-main.json` にあります。リポジトリのルートで実行します。

```bash
gh api repos/neko3cs/blog/rulesets --method POST --input docs/recovery/ruleset-main.json
```

画面で作るときは、GitHub の Settings → Rules → Rulesets → New branch ruleset で、次のようにします。

- Ruleset Name: `Protect main branch`、Enforcement status: Active
- Bypass list: 「Repository admin」を「Always」で足す
- Target branches: Default branch
- Restrict deletions、Block force pushes、Require a pull request before merging（承認の数は 0。マージの方法は Merge だけ）を有効にする

## 4. 別のアカウントで作り直すときに書き換える場所

アカウントやリポジトリの名前が変わると、次の場所が合わなくなります。Git に入っているので、書き換えて、PR（か、管理画面を使わない直接 push）で反映します。

| 変わるもの | 書き換える場所 |
| --- | --- |
| Cloudflare の `workers.dev` のサブドメイン（今は `neko3cs`）。受け口の Worker の URL `https://neko3cs-blog-cms-auth.<サブドメイン>.workers.dev` が変わる | `apps/blog/public/admin/config.yml` の `base_url`、`apps/blog/public/_headers` の `connect-src`（`/admin/*` の CSP）、GitHub の OAuth App の callback URL、`README.md` の callback URL |
| GitHub のリポジトリ（`neko3cs/blog`） | `apps/blog/public/admin/config.yml` の `repo`、ルールセットのコマンドの `repos/<オーナー>/<リポジトリ>` |
| GitHub のユーザー名（`neko3cs`） | `apps/cms-auth/wrangler.jsonc` の `ALLOWED_USER` |
| ブログのドメイン（`blog.neko3cs.net`） | `apps/blog/wrangler.jsonc` の `routes`、`apps/cms-auth/wrangler.jsonc` の `ALLOWED_ORIGINS`、OAuth App の Homepage URL |

`workers.dev` のサブドメインは、Cloudflare のダッシュボード → Workers & Pages に表示されます。アカウントで初めて Worker を作るときに、決めます。

## 5. 作り直したあとの確認

1. **デプロイが成功する。** GitHub の Actions → Deploy → Run workflow で実行し、すべてのステップが緑になる
2. **全 URL が元どおりに返る。** `blog.neko3cs.net` に対して、はてなブログ時代の全 URL（`apps/blog/migration/baseline.csv`）を確かめる。

   ```bash
   pnpm --filter blog check:urls https://blog.neko3cs.net
   ```

3. **管理画面で、ログインと保存ができる。** `https://blog.neko3cs.net/admin/` を開き、GitHub でログインする。下書きの記事を1つ保存して、`main` にコミットされ、デプロイが走ることを確かめる（確かめたら、`git revert` で戻すか、記事を削除する）
4. **`main` のルールセット。** PR を経由せずに、管理画面からの保存（管理者の直接コミット）が通ること。一方で、`main` の強制 push と削除は、止まること

## 6. 設定の書き出しを更新する

設定を変えたら、書き出しも更新して、コミットします。秘密情報は含まれません。

**`main` のルールセット**（リポジトリのルートで実行します。`<id>` は `gh api repos/neko3cs/blog/rulesets` で確かめます）

```bash
gh api repos/neko3cs/blog/rulesets/<id> --jq 'del(.id,.node_id,.created_at,.updated_at,.current_user_can_bypass,._links,.source,.source_type)' > docs/recovery/ruleset-main.json
```

**DNS のレコード**（#14 のあとに置きます）: Cloudflare のダッシュボード → `neko3cs.net` → DNS → Records → Export で、BIND 形式のファイルを書き出し、`docs/recovery/dns-neko3cs.net.txt` に置きます。
