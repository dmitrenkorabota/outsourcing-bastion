import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { createSession } from '@/lib/session'

type TelegramAuthData = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
  inviteCode?: string
}

function verifyTelegramHash(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...rest } = data
  const checkString = Object.entries(rest)
    .filter(([k]) => k !== 'inviteCode')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  return hmac === hash
}

export async function POST(req: NextRequest) {
  const body: TelegramAuthData = await req.json()
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    return NextResponse.json({ error: 'Bot not configured' }, { status: 500 })
  }

  if (!verifyTelegramHash(body, botToken)) {
    return NextResponse.json({ error: 'Invalid auth data' }, { status: 401 })
  }

  // Check auth_date is not older than 1 day
  const age = Math.floor(Date.now() / 1000) - body.auth_date
  if (age > 86400) {
    return NextResponse.json({ error: 'Auth data expired' }, { status: 401 })
  }

  let user = await db.user.findUnique({ where: { telegramId: BigInt(body.id) } })

  if (!user) {
    const userCount = await db.user.count()

    if (userCount === 0) {
      // First ever user — becomes admin, no invite needed
      user = await db.user.create({
        data: {
          telegramId: BigInt(body.id),
          firstName: body.first_name,
          lastName: body.last_name ?? null,
          username: body.username ?? null,
          photoUrl: body.photo_url ?? null,
          isAdmin: true,
        },
      })
    } else {
      // New user — requires invite code
      if (!body.inviteCode) {
        return NextResponse.json({ error: 'Invite code required' }, { status: 403 })
      }

      const invite = await db.inviteCode.findUnique({
        where: { code: body.inviteCode.toUpperCase() },
      })

      if (!invite || invite.isUsed) {
        return NextResponse.json({ error: 'Invalid or used invite code' }, { status: 403 })
      }

      user = await db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            telegramId: BigInt(body.id),
            firstName: body.first_name,
            lastName: body.last_name ?? null,
            username: body.username ?? null,
            photoUrl: body.photo_url ?? null,
            invitedById: invite.createdById,
          },
        })
        await tx.inviteCode.update({
          where: { id: invite.id },
          data: { isUsed: true, usedById: created.id, usedAt: new Date() },
        })
        return created
      })
    }
  } else {
    // Update profile info
    user = await db.user.update({
      where: { id: user.id },
      data: {
        firstName: body.first_name,
        lastName: body.last_name ?? null,
        username: body.username ?? null,
        photoUrl: body.photo_url ?? null,
      },
    })
  }

  await createSession({ userId: user.id, isAdmin: user.isAdmin })
  return NextResponse.json({ ok: true })
}
