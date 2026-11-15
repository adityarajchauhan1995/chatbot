import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

const apiKey = process.env.GEMINI_API_KEY?.trim()
const model = process.env.GEMINI_MODEL?.trim() || 'gemini-4-hydrogen'
const port = Number(process.env.API_PORT || 3001)
const host = process.env.API_HOST || '127.0.0.1'
const maxBodyBytes = 48 * 1024
const maxMessageLength = 4000
const maxHistoryLength = 20
const rateLimit = 20
const rateWindowMs = 60_000
const requestsByAddress = new Map<string, { count: number; resetAt: number }>()

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

class HttpError extends Error {
  readonly status: number

  constructor(
    status: number,
    message: string,
  ) {
    super(message)
    this.status = status
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sendJson(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(data))
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let bytesRead = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytesRead += buffer.length
    if (bytesRead > maxBodyBytes) {
      throw new HttpError(413, 'The message is too large.')
    }
    chunks.push(buffer)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new HttpError(400, 'The request body must be valid JSON.')
  }
}

function validateMessages(body: unknown): { message: string; history: ChatMessage[] } {
  if (!isRecord(body) || typeof body.message !== 'string') {
    throw new HttpError(400, 'A message is required.')
  }

  const message = body.message.trim()
  if (!message || message.length > maxMessageLength) {
    throw new HttpError(400, `Messages must be between 1 and ${maxMessageLength} characters.`)
  }

  if (body.history !== undefined && !Array.isArray(body.history)) {
    throw new HttpError(400, 'Conversation history must be a list of messages.')
  }

  const history: ChatMessage[] = (body.history ?? []).map((item: unknown) => {
    if (
      !isRecord(item) ||
      (item.role !== 'assistant' && item.role !== 'user') ||
      typeof item.content !== 'string' ||
      !item.content.trim() ||
      item.content.length > maxMessageLength
    ) {
      throw new HttpError(400, 'Conversation history contains an invalid message.')
    }

    return { role: item.role, content: item.content.trim() }
  })

  if (history.length > 100) {
    throw new HttpError(400, 'Conversation history is too long.')
  }

  if (history.at(-1)?.role !== 'user' || history.at(-1)?.content !== message) {
    history.push({ role: 'user', content: message })
  }

  return { message, history: history.slice(-maxHistoryLength) }
}

function allowRequest(address: string): boolean {
  const now = Date.now()
  const current = requestsByAddress.get(address)
  if (!current || now >= current.resetAt) {
    requestsByAddress.set(address, { count: 1, resetAt: now + rateWindowMs })
    return true
  }
  if (current.count >= rateLimit) return false

  current.count += 1
  return true
}

function toGeminiContents(history: ChatMessage[]) {
  const firstUserMessage = history.findIndex((item) => item.role === 'user')
  const messages = firstUserMessage === -1 ? [] : history.slice(firstUserMessage)
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

  for (const message of messages) {
    const role = message.role === 'assistant' ? 'model' : 'user'
    const previous = contents.at(-1)

    if (previous?.role === role) {
      previous.parts[0].text += `\n${message.content}`
    } else {
      contents.push({ role, parts: [{ text: message.content }] })
    }
  }

  return contents
}

function extractReply(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) {
    throw new Error('Gemini returned an invalid response.')
  }

  const candidate = payload.candidates[0]
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
    throw new Error('Gemini did not return a text reply.')
  }

  const reply = candidate.content.parts
    .filter((part): part is Record<string, unknown> => isRecord(part) && part.thought !== true)
    .map((part) => part.text)
    .filter((text): text is string => typeof text === 'string')
    .join('')
    .trim()

  if (!reply) throw new Error('Gemini did not return a text reply.')
  return reply
}

async function handleChat(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Use POST to send a chat message.' })
    return
  }

  const address = request.socket.remoteAddress ?? 'unknown'
  if (!allowRequest(address)) {
    sendJson(response, 429, { error: 'Too many messages. Please wait a minute and try again.' })
    return
  }

  if (!apiKey) {
    sendJson(response, 503, {
      error: 'Gemini is not configured. Add GEMINI_API_KEY to your .env file and restart the server.',
    })
    return
  }

  const { history } = validateMessages(await readJsonBody(request))
  const contents = toGeminiContents(history)
  if (!contents.length) {
    throw new HttpError(400, 'A user message is required.')
  }

  let upstream: Response
  try {
    upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'You are a friendly, concise product support assistant. Be clear and helpful. If you are unsure, say so.',
            }],
          },
          contents,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      sendJson(response, 504, { error: 'Gemini took too long to respond. Please try again.' })
      return
    }
    console.error('Could not reach the Gemini API.')
    sendJson(response, 502, { error: 'Could not reach Gemini. Please try again shortly.' })
    return
  }

  if (upstream.status === 429) {
    sendJson(response, 429, { error: 'Gemini rate limit reached. Wait a little and try again.' })
    return
  }
  if (!upstream.ok) {
    console.error(`Gemini API returned HTTP ${upstream.status}.`)
    sendJson(response, 502, {
      error: 'Gemini request failed. Check your server API key, model, and Google AI Studio limits.',
    })
    return
  }

  let payload: unknown
  try {
    payload = await upstream.json()
  } catch {
    console.error('Gemini returned an invalid JSON response.')
    sendJson(response, 502, { error: 'Gemini returned an invalid response. Please try again.' })
    return
  }

  try {
    sendJson(response, 200, { reply: extractReply(payload) })
  } catch {
    sendJson(response, 502, { error: 'Gemini did not return a text reply. Try rephrasing your message.' })
  }
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('API_PORT must be a valid TCP port.')
}

const server = createServer((request, response) => {
  if (request.url !== '/api/chat') {
    sendJson(response, 404, { error: 'Not found.' })
    return
  }

  void handleChat(request, response).catch((error: unknown) => {
    if (response.headersSent) {
      response.destroy()
      return
    }
    if (error instanceof HttpError) {
      sendJson(response, error.status, { error: error.message })
      return
    }
    console.error('Unexpected error while handling a chat request.')
    sendJson(response, 500, { error: 'The chat service encountered an unexpected error.' })
  })
})

server.listen(port, host, () => {
  console.log(`Chat API listening on http://${host}:${port}`)
  if (!apiKey) console.warn('GEMINI_API_KEY is unset; chat requests will return 503.')
})
