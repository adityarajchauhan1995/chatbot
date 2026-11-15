import { ChatWidget } from './ChatWidget'
import { sendToGemini } from './chatApi'
import './ChatWidget.css'
import './App.css'

const suggestions = [
  'What can you help me with?',
  'How do I get started?',
  'Can I connect this to my app?',
]

function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Support home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 5.5h12v8H9l-3.5 2v-2H4v-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M7 8.5h6M7 10.8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
          <span>Support</span>
        </a>
        <span className="topbar-note">Questions? We’re here to help.</span>
        <a className="topbar-link" href="#chat">Chat now <span aria-hidden="true">↗</span></a>
      </header>

      <section className="showcase" aria-labelledby="page-title">
        <div className="intro">
          <span className="eyebrow"><span className="eyebrow-dot" /> CUSTOMER SUPPORT</span>
          <h1 id="page-title">How can we<br /><span>help you today?</span></h1>
          <p>
            Find quick answers to common questions or connect with support.
            Send us a message and we’ll point you in the right direction.
          </p>
          <div className="intro-details">
            <span><span className="detail-check">✓</span> Quick answers</span>
            <span><span className="detail-check">✓</span> Available anytime</span>
          </div>
          <div className="sparkle sparkle-one" aria-hidden="true">✳</div>
          <div className="sparkle sparkle-two" aria-hidden="true">✦</div>
        </div>

        <div className="demo-column" id="chat">
          <div className="demo-label">
            <span className="demo-label-dot" />
            <span>LIVE PREVIEW</span>
            <span className="demo-label-line" />
            <span>01 / 01</span>
          </div>
          <ChatWidget
            title="Support assistant"
            subtitle="We’re here to help"
            welcomeMessage="Hi there! 👋 How can I help you today?"
            suggestions={suggestions}
            onSend={sendToGemini}
          />
          <p className="demo-caption"><span aria-hidden="true">✳</span> AI replies use Gemini. Free-tier data-use terms apply.</p>
        </div>
      </section>

      <footer className="page-footer">
        <span>HERE WHEN YOU NEED HELP.</span>
        <span>ASK A QUESTION <span aria-hidden="true">↗</span></span>
      </footer>
    </main>
  )
}

export default App
