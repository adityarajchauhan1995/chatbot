# Support Chat

A standalone React + TypeScript chat widget, connected to the Gemini API through a small server-side endpoint. Use it as a React component or embed the generated custom element on a non-React site.

## Configure Gemini

```sh
npm install
cp .env.example .env
```

Create an API key in [Google AI Studio](https://aistudio.google.com/apikey) and add it to `.env`:

```dotenv
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-4-hydrogen
```

`GEMINI_API_KEY` is read only by the Node server. Do not prefix it with `VITE_` or put it in frontend code. The default model is Gemini 4 Hydrogen; set `GEMINI_MODEL` if you want to use another model available to your API key.

## Run the demo

```sh
npm run dev
```

This starts the Vite app and API server together. The Vite development server proxies `/api/chat` to the Node server. If no key is configured, chat requests show a setup error instead of silently falling back to local replies.

## Use in a React app

Import the widget and its prop types from `src/index.ts`:

```tsx
import { ChatWidget, type ChatRequestHandler } from './src'

const sendMessage: ChatRequestHandler = async (message, history) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })

  if (!response.ok) {
    throw new Error('The chat service is temporarily unavailable.')
  }

  const data: { reply: string } = await response.json()
  return data.reply
}

export function SupportChat() {
  return (
    <ChatWidget
      title="Product support"
      welcomeMessage="Hi! What can we help with?"
      onSend={sendMessage}
    />
  )
}
```

`onSend` receives the latest message and the conversation history, and returns the assistant's reply. The demo uses this callback to call the server endpoint. Without `onSend`, the widget uses local sample responses.

## Embed on another website

Build the app and the framework-independent custom element bundle:

```sh
npm run build
```

Host `dist/embed/chat-widget.js`, then add the element to any page:

```html
<script type="module" src="https://your-cdn.example/chat-widget.js"></script>
<chat-widget
  assistant-name="Product support"
  subtitle="We usually reply right away"
  welcome-message="Hi! What can we help with?"
  suggestions="Getting started|Contact support"
></chat-widget>
```

Set the element's `onSend` property in JavaScript to connect your own backend. The response endpoint should return JSON with a `reply` string:

```html
<script type="module">
  const chat = document.querySelector('chat-widget')
  chat.onSend = async (message, history) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    })
    if (!response.ok) throw new Error('The chat service is temporarily unavailable.')
    const data = await response.json()
    return data.reply
  }
</script>
```

The custom element bundles React and isolates the chat styles in a Shadow DOM. Add the element to your own container to control its width. On other sites, set `onSend` to call your own backend, or configure a same-origin `/api/chat` route to this server.

## Free AI API options to evaluate

The app is connected to Gemini using the `gemini-4-hydrogen` model by default. Google's [pricing page](https://ai.google.dev/gemini-api/docs/pricing) currently lists free standard-tier input and output for this model. Free-tier quotas are limited and can change; check your project's [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). Google's current terms say free-tier content may be used to improve its products, so don't send sensitive or confidential data through the free tier.

| Provider | Free path | Considerations |
| --- | --- | --- |
| [GroqCloud](https://console.groq.com/docs/rate-limits) | Developer access has per-model rate limits; exact limits are shown in the account. | Limits are organization-level and vary by model. Treat it as a prototyping option until current pricing and production terms meet your needs. |
| [OpenRouter](https://openrouter.ai/docs/guides/routing/routers/free-models-router) | `openrouter/free` routes to available free models. | Free-model availability and rate limits can vary; the selected model may change. |

## Server and deployment notes

- `npm run build` builds the web app, embeddable widget, and TypeScript API server. Run the server with `npm start` after setting `GEMINI_API_KEY` in the environment (or in `.env`).
- The server accepts same-origin `POST /api/chat` requests, limits payload and message sizes, and applies a basic per-IP in-memory request limit. For a public production deployment, add durable rate limiting, authentication or abuse controls, and HTTPS at your hosting layer.
- In production, serve the web build and route `/api/chat` to the Node API server through your reverse proxy. `npm run preview` is only a static preview and does not proxy API calls.
- By default, the API server binds to `127.0.0.1`. Set `API_HOST=0.0.0.0` only when your deployment requires access from another container or reverse proxy.
- The widget is provider-independent: use its `onSend` handler with your own backend if you later switch providers.
