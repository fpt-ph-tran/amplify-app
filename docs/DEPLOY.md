# Deploying QuickCart

## 0. Prerequisites

- An AWS account (a throwaway/sandbox account is fine — this app is meant to
  misbehave on purpose).
- Node.js 20+, npm.
- The AWS CLI configured locally (`aws configure`) **or** just an access
  key/secret pair, for step 2.
- Cowork Local running with a Bugs Hunter project's **Public URL** (Cloudflare
  tunnel) mode enabled — see the main `CoworkHackathon` repo. Copy the
  `https://<random>.trycloudflare.com/hook/<token>` URL it shows you; that's
  your `COWORK_WEBHOOK_URL`.

## 1. First-time local setup

```bash
npm install
npx ampx sandbox
```

`ampx sandbox` provisions a real (but disposable, per-developer) copy of the
whole backend in your AWS account and writes the REAL `amplify_outputs.json`
(overwriting the placeholder committed for local builds). Leave it running in
one terminal — it live-redeploys on file changes.

In a second terminal:

```bash
npx tsx scripts/seed.ts   # populate ~20-30 demo products
npm run dev               # http://localhost:3000
```

## 2. Point the log-forwarder at Cowork Local

The `log-forwarder` Lambda reads `COWORK_WEBHOOK_URL` from its own
environment (`amplify/functions/log-forwarder/resource.ts`). For a sandbox
run, export it before starting the sandbox:

```bash
export COWORK_WEBHOOK_URL="https://<your-tunnel>.trycloudflare.com/hook/<token>"
npx ampx sandbox
```

**This is the one thing you'll re-do every demo session** — the Cloudflare
tunnel URL changes every time the Cowork Local desktop app restarts. Either
re-export and let the sandbox redeploy, or update the deployed Lambda's
environment variable directly via the AWS Console/CLI without a full
redeploy:

```bash
aws lambda update-function-configuration \
  --function-name <the log-forwarder function name from the Amplify console> \
  --environment "Variables={COWORK_WEBHOOK_URL=https://<new-tunnel>/hook/<token>}"
```

## 3. Real deploy + CI/CD (GitHub Actions → Amplify Hosting)

1. Create an Amplify app once (console, or `ampx pipeline-deploy` handles
   backend provisioning headlessly — see AWS's Amplify Gen 2 docs for the
   current one-liner). Note the App ID.
2. In your GitHub repo settings → Secrets and variables → Actions, add:
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (or configure OIDC and swap
     the workflow's auth step — recommended for anything longer-lived than a
     demo)
   - `AMPLIFY_APP_ID`
   - `COWORK_WEBHOOK_URL` (same caveat as above — update this secret + re-run
     the workflow whenever the tunnel URL changes)
3. Push to `main`. `.github/workflows/deploy.yml` runs `ampx pipeline-deploy`
   for the backend; Amplify Hosting builds and deploys the Next.js frontend
   from the SAME repo (connect the repo once in the Amplify Console, or let
   the pipeline-deploy step handle it — either way, after the one-time app
   creation, every `git push` to `main` redeploys everything).

That's it — "cấu hình API key AWS là deploy được luôn."

## 4. Sanity-checking the pipeline end-to-end

1. Open QuickCart, go to `/admin/chaos`.
2. Click any bug's "Trigger" button.
3. Within roughly a minute (CloudWatch Alarm evaluation period), an incident
   should appear in Cowork Local's Bugs Hunter tab for this project.
4. If nothing shows up: check the `log-forwarder` Lambda's CloudWatch Logs
   first (network/URL issues log there, not silently) before touching the
   alarm/metric-filter config.
