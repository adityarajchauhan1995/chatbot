import { ChatWidget } from './ChatWidget'
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
        <a className="brand" href="/" aria-label="Morrow home">
          <span className="brand-mark" aria-hidden="true">m</span>
          <span>morrow</span>
        </a>
        <span className="topbar-note">A little help goes a long way</span>
        <a className="topbar-link" href="#chat">Try the demo <span aria-hidden="true">↗</span></a>
      </header>

      <section className="showcase" aria-labelledby="page-title">
        <div className="intro">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEW HELLO</span>
          <h1 id="page-title">Good conversations<br />start <span>right here.</span></h1>
          <p>
            A friendly, standalone chat widget that fits right into your product.
            No AI connection needed to get started.
          </p>
          <div className="intro-details">
            <span><span className="detail-check">✓</span> Ready to embed</span>
            <span><span className="detail-check">✓</span> Bring your own backend</span>
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
            title="Morrow support"
            subtitle="We’re here to help"
            welcomeMessage="Hey there! 👋 I’m the Morrow assistant. What can I help you figure out today?"
            suggestions={suggestions}
          />
          <p className="demo-caption"><span aria-hidden="true">✳</span> Replies are local demo responses — no AI API connected.</p>
        </div>
      </section>

      <footer className="page-footer">
        <span>SMALL WIDGET. BIG WELCOME.</span>
        <span>MADE TO MAKE IT YOURS <span aria-hidden="true">↗</span></span>
      </footer>
    </main>
  )
}

export default App
