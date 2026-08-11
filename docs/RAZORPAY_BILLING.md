# Razorpay billing setup

AgentLens uses Razorpay Subscriptions. The browser receives only the public Key ID and a short-lived subscription identifier. The Key Secret and webhook secret remain server-only.

## 1. Create the monthly plans

Create these plans in the Razorpay Dashboard before deploying:

| AgentLens plan | Amount | Billing period | Project limit |
| --- | ---: | --- | ---: |
| Pro | ₹1,499 | Monthly | 5 |
| Scale | ₹4,999 | Monthly | 25 |

Copy each Razorpay Plan ID. Razorpay plans cannot be edited or deleted after creation, so confirm the amount and period before saving them.

## 2. Configure the frontend server

Set these variables in Vercel for Production and Preview:

```text
RAZORPAY_KEY_ID=rzp_test_or_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_PRO_ID=plan_...
RAZORPAY_PLAN_SCALE_ID=plan_...
```

Do not prefix the secrets with `NEXT_PUBLIC_`. Redeploy after changing the values.

## 3. Apply the database migration

Run the existing deployment migration command:

```bash
alembic upgrade head
```

Revision `20260811_06` creates the subscription state and webhook idempotency tables.

## 4. Add the webhook

Create a Razorpay webhook pointing to:

```text
https://agentlens-web.vercel.app/api/billing/webhook
```

Use the same value as `RAZORPAY_WEBHOOK_SECRET` and subscribe to:

- `subscription.authenticated`
- `subscription.activated`
- `subscription.charged`
- `subscription.pending`
- `subscription.halted`
- `subscription.paused`
- `subscription.cancelled`
- `subscription.completed`

Configure Test and Live mode separately. Complete a Test mode subscription before replacing test keys with live keys.

## 5. Go-live checks

- Complete Razorpay KYC and business verification.
- Confirm HTTPS is active on the frontend and webhook URL.
- Confirm recurring payment capture and settlement behavior in Razorpay.
- Verify the Test payment appears in Razorpay and the AgentLens plan changes.
- Send the same webhook twice and confirm the second delivery is treated as a duplicate.
- Never log the Key Secret, webhook signature, card details, UPI credentials, or full webhook body.
