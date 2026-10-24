# Generative AI Chat

## Run the app locally

Install the frontend dependencies and start Vite:

```sh
cd frontend
npm install
npm run dev
```

In a second terminal, configure and start the API:

```sh
cd backend
npm install
cp .env.example .env
```

Set `OPENAI_API_KEY` in `backend/.env` to an OpenAI API key, then run:

```sh
npm run dev
```

The frontend proxies `/api` requests to the backend on port `3001`. The API key
must only be stored in `backend/.env`; it is never included in frontend code.
The default model is `gpt-4o-mini` and can be changed with `OPENAI_MODEL`.

The chat currently sends text conversation history to the AI. Attachments can
be displayed in the chat, but their contents are not uploaded or analyzed.