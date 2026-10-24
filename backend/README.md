# Chat API

Express and TypeScript API for the chat app. Mongoose models store users,
conversations, and messages. Controllers implement registration, login,
account-scoped history, and streamed OpenAI Responses API output; route modules
map HTTP endpoints to controllers.

## Setup

```sh
npm install
cp .env.example .env
```

Set `OPENAI_API_KEY`, `MONGODB_URI`, and a random `JWT_SECRET` with at least 32
characters in `.env`. Mongoose connects to the database named by
`MONGODB_DATABASE` (defaults to `generative_ai`). Start MongoDB separately,
then run:

```sh
npm run dev
```

The API listens on port `3001` by default. `GET /api/health` checks that the API
is running. Authentication endpoints are `POST /api/auth/register`,
`POST /api/auth/login`, and `GET /api/auth/me`. Authenticated endpoints include
`GET /api/conversations`, `GET /api/conversations/:id`, and `POST /api/chat`.
Chat replies use Server-Sent Events with `start`, `delta`, `done`, and `error`
events. Chat requests accept a `message` and optional `conversationId`; the API
loads the latest 30 saved messages for model context.

`OPENAI_MODEL`, `PORT`, `CORS_ORIGIN`, and `MONGODB_DATABASE` can be customized
through environment variables. Never expose the OpenAI key or JWT secret to
frontend code or commit `.env`.

Backend code is organized under `src/models` (Mongoose schemas),
`src/controllers` (request handling), and `src/routes` (endpoint wiring).
