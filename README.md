# Morrow Chat

A standalone React + TypeScript chat widget with local demo replies. It makes no AI or third-party requests by default. Use it as a React component or embed the generated custom element on a non-React site.

## Run the demo

```sh
npm install
npm run dev
```

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

`onSend` receives the latest message and the conversation history, and returns the assistant's reply. Without `onSend`, the widget uses a few local sample responses.

## Embed on another website

Build the app and the framework-independent custom element bundle:

```sh
npm run build
```

Host `dist/embed/morrow-chat.js`, then add the element to any page:

```html
<script type="module" src="https://your-cdn.example/morrow-chat.js"></script>
<morrow-chat
  assistant-name="Product support"
  subtitle="We usually reply right away"
  welcome-message="Hi! What can we help with?"
  suggestions="Getting started|Contact support"
></morrow-chat>
```

Set the element's `onSend` property in JavaScript to connect your own backend. The response endpoint should return JSON with a `reply` string:

```html
<script type="module">
  const chat = document.querySelector('morrow-chat')
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

The custom element bundles React and isolates the chat styles in a Shadow DOM. Add the element to your own container to control its width. Keep API keys and provider credentials on your server; a browser bundle cannot keep secrets.

## Free AI API options to evaluate

No provider is connected yet. These options currently advertise a free or no-cost path, but model availability, quotas, eligibility, and terms can change. Check the provider's live account limits before choosing one:

| Provider | Free path | Considerations |
| --- | --- | --- |
| [Google Gemini API](https://ai.google.dev/gemini-api/docs/pricing) | Free tier for selected models; the rate limits page says limits vary by model and project. | Review the free-tier data-use terms; Google says free-tier content may be used to improve its products. |
| [GroqCloud](https://console.groq.com/docs/rate-limits) | Developer access has per-model rate limits; exact limits are shown in the account. | Limits are organization-level and vary by model. Treat it as a prototyping option until current pricing and production terms meet your needs. |
| [OpenRouter](https://openrouter.ai/docs/guides/routing/routers/free-models-router) | `openrouter/free` routes to available free models. | Free-model availability and rate limits can vary; the selected model may change. |

Use a small backend or serverless function as a provider adapter: the widget calls your endpoint, and the endpoint owns the API key, provider-specific request format, validation, and rate limiting. This keeps the UI independent from any one AI provider and avoids exposing credentials to website visitors.
