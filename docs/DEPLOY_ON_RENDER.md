# Put AgentLens online from GitHub

This is the easiest hosted setup for the repository as it exists today. Render
creates three things for you from one GitHub repository:

1. your public AgentLens website (landing page, sign-in, and dashboard);
2. the public AgentLens API that receives telemetry; and
3. a PostgreSQL database that saves accounts and real telemetry.

The repository includes `render.yaml`, so you do **not** need to create these
three services by hand.

## Before you start

- Push the current repository contents to GitHub, including `render.yaml`.
- Have access to the GitHub account that owns the repository.
- Do not upload or commit `.env` files, API keys, or passwords.

## 1. Create the deployment

1. Go to [Render](https://render.com/) and sign in with GitHub.
2. Choose **New** → **Blueprint**.
3. Select the AgentLens GitHub repository and branch you want to deploy.
4. Render reads `render.yaml` and shows these resources:
   - `agentlens-web`
   - `agentlens-api`
   - `agentlens-db`
5. When Render asks for `AGENTLENS_CORS_ORIGINS`, enter this temporary value
   for the first deploy:

   ```text
   http://localhost:3000
   ```

   It lets the API start safely. You replace it with your actual web address
   after Render gives that address to you in step 3.
6. Click **Apply** / **Create Blueprint Instance** and wait for all three
   resources to finish deploying.

Render creates the API key pepper, internal service token, and website login
secret itself. You do not need to make or copy those values.

## 2. Confirm the API is alive

1. Open the `agentlens-api` service in Render.
2. Click its public URL, then add `/health` at the end. For example:

   ```text
   https://agentlens-api-xxxx.onrender.com/health
   ```

3. You should see:

   ```json
   {"status":"ok"}
   ```

If this does not work, open the API **Logs** tab. The most common cause is a
database that is still starting; Render automatically retries the database
migration while it becomes ready.

## 3. Connect the real website address

1. Open the `agentlens-web` service and click its public URL.
2. Copy the complete address, including `https://`. For example:

   ```text
   https://agentlens-web-xxxx.onrender.com
   ```

3. Go back to `agentlens-api` → **Environment**.
4. Change `AGENTLENS_CORS_ORIGINS` to that exact website address. Do not add a
   trailing slash.
5. Save and deploy the API again.

This is the browser-security setting that allows your AgentLens website to
talk to its API. The normal dashboard uses a private server-to-server path,
but this setting keeps the Diagnostics screen and approved browser checks
working safely.

Optional: on `agentlens-web` → **Environment**, add
`NEXT_PUBLIC_AGENTLENS_API_URL` with the public `agentlens-api` URL. This
pre-fills the Diagnostics screen with the right API address; the core product
does not depend on it.

## 4. Create the first account and project

1. Visit the `agentlens-web` URL.
2. Confirm the landing page appears at `/`.
3. Click **Start Monitoring**, create your account, and sign in.
4. Click **Create project**.
5. Copy the project key when it is shown. It is shown only once.

Save that project key in the environment-variable area of the app you want to
monitor. Never put it in frontend/browser code, a GitHub commit, or a public
chat.

## 5. Connect the app you want to monitor

For a Node/TypeScript server using OpenAI, Anthropic, Gemini, OpenRouter,
Mistral, Groq, or Ollama through `fetch`:

1. In that app's server host, add:

   ```text
   AGENTLENS_API_KEY=the-project-key-you-copied
   AGENTLENS_ENDPOINT=https://agentlens-api-xxxx.onrender.com
   ```

2. In that app's terminal, run:

   ```bash
   npm install agentlens
   ```

3. Add this one line to the file that starts the server, before its AI calls:

   ```ts
   import "agentlens/register";
   ```

4. Deploy that app and make one normal AI request.
5. Return to AgentLens. The project changes from **Waiting for first event**
   to **Receiving telemetry** only after a real event arrives.

The existing supported AI calls are unchanged. AgentLens observes only safe
metadata; it does not collect prompts, completions, provider headers, request
bodies, or provider API keys. Custom AI services can use the small
`agentlens.track(...)` fallback shown on the project setup screen.

## Password reset email (recommended before inviting people)

Sign-in works without an email delivery provider. To let people actually
receive password-reset messages, add these to `agentlens-web` → **Environment**:

```text
RESEND_API_KEY=your_Resend_API_key
AUTH_EMAIL_FROM=AgentLens <security@your-verified-domain.com>
```

Use an address on a domain verified with your email provider. Then save and
redeploy `agentlens-web`.

## What “free” means

Render's Free services are suitable for testing and demos, not a dependable
production product: idle web services spin down after 15 minutes and can take
about a minute to wake up. The Free Render Postgres database expires after 30
days and has no backups. Plan a paid database and services before relying on
the app for customer data.

Read Render's current [free-tier limitations](https://render.com/docs/free)
and [GitHub web-service deployment guide](https://render.com/docs/web-services)
before choosing a paid plan.
