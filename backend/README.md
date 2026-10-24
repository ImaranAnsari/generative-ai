# Chat API

This backend is an Express and TypeScript API for the React chat app. It sends
chat history to the OpenAI Responses API and keeps the OpenAI API key server-side.

## Setup

```sh
npm install
cp .env.example .env
```

Add your OpenAI API key to `OPENAI_API_KEY` in `.env`. Do not commit `.env` or
put the key in frontend environment variables. Then start the API:

```sh
npm run dev
```

The API listens on port `3001` by default. `GET /api/health` checks that the
server is running; `POST /api/chat` accepts `{ "messages": [{ "role":
"user", "content": "..." }] }` and returns `{ "reply": "..." }`.

Requests are validated, rate-limited, and protected with standard security
headers. Configure `OPENAI_MODEL`, `PORT`, and `CORS_ORIGIN` in `.env` if
needed. The Vite development server proxies `/api` requests to this service.
