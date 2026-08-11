# Provider Match

Provider Match turns a plain-language AI use case into a transparent local
comparison. It is designed to help a nontechnical user choose a provider
without sending provider credentials, production prompts, or raw model answers
to AgentLens.

## User flow

1. Open **Find my AI provider** in the signed-in AgentLens app.
2. Describe the AI job, expected traffic, normal response format, data
   sensitivity, and the most important decision factor.
3. Choose two to six providers and review the generated synthetic checks.
4. Generate a one-time runner code. It expires after 30 minutes and is stored
   only as a SHA-256 digest.
5. Run the displayed `npx agentlens match` command locally.
6. Review the recommendation and every component score in AgentLens.

## Local credentials

The runner supports these existing environment variables:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `MISTRAL_API_KEY`
- `OPENROUTER_API_KEY`
- `OLLAMA_HOST` for a non-default local Ollama address

The variables are read only by the local Node.js process. They are not included
in the result payload or printed by the runner.

## What is persisted

AgentLens stores the user-visible use-case description, selected providers,
synthetic test plan, aggregate instruction score, request success rate, timing,
token totals, estimated cost, and pass/fail explanations. It does not store
provider API keys or raw model responses.

Cost is recalculated on the AgentLens server from token totals and the
versioned provider-price snapshot; client-submitted cost totals are not trusted.

## Scoring boundary

The first release measures visible instruction-following requirements,
reliability, latency, and estimated token cost. It does not claim to measure
universal intelligence or replace a domain expert's acceptance testing. The UI
always labels the result as the best fit for the submitted use case and test
plan.

## Deployment

Apply Alembic revision `20260812_07` before deploying the frontend. No provider
credentials are required on Vercel or Render because provider calls happen on
the user's machine.
