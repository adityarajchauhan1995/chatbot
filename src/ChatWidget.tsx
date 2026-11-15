import { useEffect, useRef, useState, type FormEvent } from 'react'

export type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

export type ChatRequestHandler = (
  message: string,
  history: readonly ChatMessage[],
) => Promise<string>

export type ChatWidgetProps = {
  title?: string
  subtitle?: string
  welcomeMessage?: string
  suggestions?: string[]
  onSend?: ChatRequestHandler
}

const defaultWelcome = 'Hi there! How can I help you today?'

async function localReply(message: string): Promise<string> {
  const text = message.toLowerCase()

  if (text.includes('start') || text.includes('install') || text.includes('setup')) {
    return 'Getting started is easy: add the ChatWidget to your React app, then customize its title, welcome message, and suggestions. You can connect your own backend whenever you’re ready.'
  }
  if (text.includes('connect') || text.includes('integrat') || text.includes('app')) {
    return 'You can embed ChatWidget anywhere in a React app. To connect a service, pass an onSend handler that calls your own backend and returns its reply. Keep provider API keys on the server, not in the browser.'
  }
  if (text.includes('help') || text.includes('do')) {
    return 'I can answer common questions, guide customers through setup, or hand off to your team. These demo replies are local; connect your own response handler to make the conversation yours.'
  }
  return 'Thanks for your message! This demo is using local sample replies. Connect a response handler to plug in your own service.'
}

export function ChatWidget({
  title = 'Chat with us',
  subtitle = 'We usually reply right away',
  welcomeMessage = defaultWelcome,
  suggestions = [],
  onSend,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: welcomeMessage },
  ])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const logRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  async function sendMessage(content: string) {
    const text = content.trim()
    if (!text || isSending) return

    const userMessage: ChatMessage = {
      id: `message-${messages.length}`,
      role: 'user',
      content: text,
    }
    const history = [...messages, userMessage]
    setMessages(history)
    setDraft('')
    setError('')
    setIsSending(true)

    try {
      const response = await (onSend
        ? onSend(text, history)
        : localReply(text))

      if (!response.trim()) {
        throw new Error('The reply was empty. Please try again.')
      }

      setMessages((current) => [
        ...current,
        { id: `message-${current.length}`, role: 'assistant', content: response },
      ])
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Something went wrong while sending your message. Please try again.',
      )
    } finally {
      setIsSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(draft)
  }

  function startNewChat() {
    setMessages([{ id: 'welcome', role: 'assistant', content: welcomeMessage }])
    setDraft('')
    setError('')
  }

  return (
    <section className="chat-widget" aria-label={title}>
      <header className="chat-header">
        <div className="chat-brand-avatar" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M8 21.5 16 7l8 14.5h-5.2L16 15.9l-2.8 5.6H8Z" fill="currentColor" />
            <circle cx="23.5" cy="8.5" r="2.5" fill="#F4B95F" />
          </svg>
        </div>
        <div className="chat-heading">
          <h2>{title}</h2>
          <p><span className="online-indicator" />{subtitle}</p>
        </div>
        <button className="new-chat-button" type="button" onClick={startNewChat} disabled={isSending} aria-label="Start a new chat" title="Start a new chat">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="chat-content">
        <div className="chat-date"><span />TODAY<span /></div>
        <ul className="message-list" role="log" aria-live="polite" aria-label="Chat messages" ref={logRef}>
          {messages.map((message) => (
            <li className={`message-row message-row-${message.role}`} key={message.id}>
              {message.role === 'assistant' && (
                <span className="message-avatar" aria-hidden="true">m</span>
              )}
              <p className="message-bubble">{message.content}</p>
            </li>
          ))}
          {isSending && (
            <li className="message-row message-row-assistant" aria-label="Assistant is typing">
              <span className="message-avatar" aria-hidden="true">m</span>
              <span className="typing-indicator"><i /><i /><i /></span>
            </li>
          )}
        </ul>

        {messages.length === 1 && suggestions.length > 0 && (
          <div className="suggestion-list" aria-label="Suggested messages">
            {suggestions.map((suggestion) => (
              <button
                className="suggestion-chip"
                key={suggestion}
                type="button"
                onClick={() => void sendMessage(suggestion)}
                disabled={isSending}
              >
                {suggestion}<span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chat-compose-area">
        {error && <p className="chat-error" role="alert">{error}</p>}
        <form className="chat-compose" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="chat-message">Write a message</label>
          <input
            id="chat-message"
            autoComplete="off"
            placeholder="Write a message..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={isSending}
          />
          <button className="send-button" type="submit" disabled={!draft.trim() || isSending} aria-label="Send message">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m3.3 9.7 12.9-6-4.1 12.9-2.5-5.1-6.3-1.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m9.6 11.5 4.1-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </form>
        <p className="chat-powered">POWERED BY <span>MORROW</span></p>
      </div>
    </section>
  )
}
