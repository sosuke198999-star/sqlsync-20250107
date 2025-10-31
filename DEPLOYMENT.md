# Deploy to Render (Web Service)

このリポジトリを Render の Web Service にデプロイする際の推奨設定をまとめます。

## 概要
- フロントエンドと API を同じ Node サーバ（`server/index.ts`）で配信します。
- ビルド：Vite でクライアントをビルドし、esbuild でサーバをバンドルして `dist/` に出力します。

---

## Render の Service 設定（推奨）

- Service type: Web Service
- Environment: Node
- Branch: `main` (またはデプロイしたいブランチ)

### Build Command
以下のどちらか（環境に合わせて選択）を Render の Build Command に設定してください。

推奨（一般的）:

```
npm ci && npm run build
```

もし build 時に devDependencies がインストールされない場合（稀）:

```
npm ci --include=dev && npm run build
```

注: `npm run build` は既に `package.json` 内で次を実行します:
```
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### Start Command
Render の Start Command に下記を設定してください:

```
npm run start
```

（あるいは直接）

```
node dist/index.js
```

`package.json` の `start` スクリプトは `node dist/index.js` を実行するようになっています。

---

## 環境変数（最低限）
アプリの動作に必要な環境変数の一例です。Render のダッシュボードで `Environment` → `Environment Variables` に追加してください。

- `NODE_ENV` = `production`
- `PORT` = （空欄で可。Render は実行環境で自動的に `PORT` を提供します）
- Google Drive / service account
  - `GOOGLE_SERVICE_ACCOUNT_JSON` または `GOOGLE_SERVICE_ACCOUNT_JSON_PATH`
  - `GOOGLE_DRIVE_PARENT_FOLDER_ID`
  - `GOOGLE_DRIVE_SHARE_ANYONE_WITH_LINK` (true/false)
- データベース / セッション / メールなど（プロジェクト依存）:
  - `DATABASE_URL` (`NEON` などを使う場合)
  - `SESSION_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`（メール送信を使う場合）

※ シークレットは Render の「Environment」セクションに設定し、リポジトリには置かないでください。

---

## Docker を使う場合
このリポジトリには `Dockerfile` が含まれています。Render の Service 作成時に「Advanced」から Docker を選択すれば、`Dockerfile` に基づきビルド・起動されます。Docker を使う場合は Build / Start Command は不要です。

---

## ローカルでの素早い検証（推奨）
Render にデプロイする前にローカルでビルド＆起動を確認してください。

```
npm ci
npm run build
npm run start
```

起動後、デフォルトでは `http://localhost:5000` にアクセスできます（`PORT` 環境変数で変更可）。

---

## トラブルシュート
- ビルドで esbuild が失敗する場合: `esbuild` は devDependencies に入っているため、`npm ci --include=dev` を試してください。
- 起動後に静的ファイルが見えない場合: ビルドログを確認し `dist/` が生成されているか、また `server/serveStatic` が本番環境で呼ばれているか確認してください（`server/index.ts` の `app.get('env')` 条件に依存します）。

---

## 次のステップ（推奨）
1. Render で新しい Web Service を作成し、リポジトリを接続します。
2. Build Command と Start Command を上記の通り設定します。
3. 必要な環境変数を Render ダッシュボードに設定します。
4. デプロイ後にログを確認して問題がないか検証します。

必要なら、Render 用の `render.yaml`（Infrastructure as Code）を一緒に作成します。希望があれば教えてください。
# SQLSync Deployment Guide

This document outlines the minimum handover package and concrete steps required to publish SQLSync on the public internet while keeping Supabase and other integrations secure.

## 1. Deliverables to the Hosting Team

- Application source (this repository) or a container image registry URL.
- `.env.prod` populated from `.env.prod.example` with production secrets:
  - `SUPABASE_URL` and the service-role key restricted for API use only.
  - SMTP credentials, notification recipients.
  - Google Drive folder / service-account references if file sync is needed.
- Supabase project information:
  - Enabled Row Level Security (RLS) policies for `users` and `claims` tables.
  - Backup / PITR settings, rotation policy for service-role keys.
- Contact points and on-call procedures for incident response.

## 2. Preparing the Environment

1. **Create secrets**  
   Store the contents of `.env.prod` in your platform’s secret manager. Never commit secrets to Git.

2. **Provision hosting**  
   Use a managed platform (Render, Railway, Fly.io, AWS ECS/Fargate, etc.) that supports Docker deploys, HTTPS termination, and automatic restarts.

3. **Network hardening**  
   - Expose only port `5000` (or remap to 80/443).  
   - Place a reverse proxy / load balancer (Nginx, API Gateway, Cloud Load Balancer) in front of the Node app for TLS, rate limiting, and request filtering.  
   - Restrict inbound management access via VPN or IP allowlists where possible.

4. **Supabase safeguards**  
   - Enable RLS and ensure policies allow access only via the service-role API or specific roles.  
   - Revoke unused API keys; rotate active keys on a scheduled cadence.  
   - Confirm nightly backups and PITR are active; document restore procedures.

## 3. Building the Application

```bash
npm install
npm run build            # bundles client + server into dist/
```

To verify the production bundle locally:

```bash
NODE_ENV=production npm run start    # defaults to port 5000
```

### Docker build & run

```bash
docker build -t sqlsync:latest .
docker run --rm -p 5000:5000 --env-file .env.prod sqlsync:latest
```

Configure your hosting platform to perform the same build steps or pull from a registry that you maintain.

## 4. Deployment Workflow

1. Push changes to the main branch (or a dedicated release branch).  
2. CI/CD pipeline runs lint/tests (add as needed), builds the Docker image, and pushes to the registry.  
3. The hosting environment pulls the image, injects secrets, and starts the container.  
4. Health checks hit `GET /health` (implement if not already present) to ensure the API is ready before promoting traffic.  
5. Apply database migrations via `npm run db:push` or your preferred migration process. Automate this step in CI/CD to avoid drift.

## 5. Monitoring & Operations

- **Logging**: Stream stdout/stderr to the hosting provider’s log service; optionally ship to ELK, CloudWatch, or Datadog.  
- **Metrics & Alerts**: Track latency, request rate, error rate. Set alerts for login failures, 5xx spikes, and Supabase quota usage.  
- **Security**: Enable Web Application Firewall (WAF) rules, enforce TLS 1.2+, and schedule key/password rotation.  
- **Backups**: Verify Supabase backups and Google Drive archives; test restoration quarterly.

## 6. Access Management

- Integrate with corporate SSO or issue unique credentials; store hashed passwords only.  
- If exposing partner access, provide scoped accounts and document revocation procedures.  
- Maintain an access log and review quarterly to ensure least privilege.

## 7. Support Checklist

- Incident escalation tree (primary + backup contact).  
- Runbook for common issues (Supabase outage, SMTP failure, Google Drive quota).  
- Change management policy: how to schedule maintenance, notify users, and roll back.

---

With this package the receiving team can deploy the service, keep secrets isolated from source control, and enforce the operational controls needed for a public-facing workload.
