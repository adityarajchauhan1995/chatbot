import { createRoot, type Root } from 'react-dom/client'
import { ChatWidget, type ChatRequestHandler } from './ChatWidget'
import widgetStyles from './ChatWidget.css?inline'

export class MorrowChatElement extends HTMLElement {
  static observedAttributes = ['assistant-name', 'subtitle', 'welcome-message', 'suggestions']

  private root: Root | undefined
  private messageHandler: ChatRequestHandler | undefined

  get onSend(): ChatRequestHandler | undefined {
    return this.messageHandler
  }

  set onSend(handler: ChatRequestHandler | undefined) {
    this.messageHandler = handler
    this.renderWidget()
  }

  connectedCallback() {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    if (!shadow.querySelector('.morrow-chat-styles')) {
      const style = document.createElement('style')
      style.className = 'morrow-chat-styles'
      style.textContent = widgetStyles
      shadow.append(style)
    }

    let mount = shadow.querySelector<HTMLDivElement>('.morrow-chat-mount')
    if (!mount) {
      mount = document.createElement('div')
      mount.className = 'morrow-chat-mount'
      shadow.append(mount)
    }

    this.root = createRoot(mount)
    this.renderWidget()
  }

  disconnectedCallback() {
    this.root?.unmount()
    this.root = undefined
  }

  attributeChangedCallback() {
    this.renderWidget()
  }

  private renderWidget() {
    this.root?.render(
      <ChatWidget
        title={this.getAttribute('assistant-name') ?? undefined}
        subtitle={this.getAttribute('subtitle') ?? undefined}
        welcomeMessage={this.getAttribute('welcome-message') ?? undefined}
        suggestions={
          this.getAttribute('suggestions')
            ?.split('|')
            .map((suggestion) => suggestion.trim())
            .filter(Boolean) ?? []
        }
        onSend={this.messageHandler}
      />,
    )
  }
}

if (!customElements.get('morrow-chat')) {
  customElements.define('morrow-chat', MorrowChatElement)
}

declare global {
  interface HTMLElementTagNameMap {
    'morrow-chat': MorrowChatElement
  }
}
