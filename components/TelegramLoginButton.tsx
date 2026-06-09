'use client'

import { useEffect, useRef } from 'react'

type TelegramUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void
  }
}

export default function TelegramLoginButton({
  botUsername,
  inviteCode,
  locale,
}: {
  botUsername: string
  inviteCode: string | null
  locale: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.onTelegramAuth = async (user: TelegramUser) => {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, inviteCode }),
      })
      if (res.ok) {
        window.location.href = `/${locale}`
      } else {
        const data = await res.json()
        alert(data.error ?? 'Authentication failed')
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true

    containerRef.current?.appendChild(script)

    return () => {
      delete window.onTelegramAuth
    }
  }, [botUsername, inviteCode, locale])

  return <div ref={containerRef} className="flex justify-center" />
}
