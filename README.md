# Generative AI Chat

An authenticated AI chat application with MongoDB conversation history and
streamed assistant responses.

## Run locally

Start MongoDB locally, then configure the backend:

```sh
cd backend
npm install
cp .env.example .env
```

Set at least one of `OPENAI_API_KEY` or `GROQ_API_KEY`, and a random
`JWT_SECRET` with at least 32 characters in `backend/.env`, then start the API.
Set `TAVILY_API_KEY` there to enable the optional **Search the web** composer
toggle.
OpenAI is attempted first; Groq is used automatically if the OpenAI request
fails. `GROQ_MODEL` defaults to `openai/gpt-oss-20b`.

```sh
npm run dev
```

In a second terminal, run the frontend:

```sh
cd frontend
npm install
npm run dev
```

The Vite server proxies `/api` requests to `http://localhost:3001`. Register an
account in the app; conversations are saved to the MongoDB database configured
by `MONGODB_URI` and `MONGODB_DATABASE`. The OpenAI key and JWT secret stay on
the backend. `OPENAI_MODEL` defaults to `gpt-4o-mini`.

## Deploy with Docker Compose

Install Docker Compose, then create the backend environment file:

```sh
cp backend/.env.example backend/.env
```

Set at least one of `OPENAI_API_KEY` or `GROQ_API_KEY`, a randomly generated
`JWT_SECRET` of at least 32 characters, and optionally `TAVILY_API_KEY` in
`backend/.env`, then start the services from the repository root:

```sh
docker compose up --build -d
```

Compose loads the backend secrets from `backend/.env` and overrides
`MONGODB_URI` inside the container to use the MongoDB service hostname.

Open [http://localhost:8080](http://localhost:8080). Compose runs MongoDB, the
API, and the Nginx-served frontend; MongoDB data is kept in the `mongo-data`
volume. Do not use sample secrets in production. For internet-facing
deployments, put the app behind HTTPS and use a managed or authenticated
MongoDB service with backups.

## Features and limitations

- Email/password registration and sign-in; passwords are hashed and API
  requests use signed bearer tokens that expire after seven days.
- Conversation history is private to the signed-in account.
- Assistant responses stream as they are generated.
- Optional Tavily web search adds source links to assistant answers.
- Attachments can be displayed in the chat, but file contents are not uploaded
  or analyzed.
