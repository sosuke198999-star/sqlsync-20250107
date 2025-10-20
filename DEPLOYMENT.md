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
