import type { ChatRequestHandler } from './ChatWidget'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const sendToGemini: ChatRequestHandler = async (message, history) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('The chat service returned an invalid response. Please try again.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.error === 'string'
      ? payload.error
      : 'The chat service could not answer. Please try again.'
    throw new Error(message)
  }

  if (!isRecord(payload) || typeof payload.reply !== 'string') {
    throw new Error('The chat service returned an invalid reply. Please try again.')
  }

  return payload.reply
}
