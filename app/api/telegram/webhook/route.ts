import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) return true // not configured — allow (set secret in production)
  const header = req.headers.get('x-telegram-bot-api-secret-token')
  return header === secret
}

export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update = await req.json()

  // Handle bot commands / messages here
  const message = update?.message
  if (message?.text === '/start') {
    const chatId = message.chat.id
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '👋 Добро пожаловать в Outsourcing Bastion!\n\nДля входа на платформу вам нужна инвайт-ссылка от участника.',
        }),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
