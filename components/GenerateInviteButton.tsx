'use client'

import { useTranslations } from 'next-intl'
import { useTransition, useState } from 'react'
import { generateInvite } from '@/lib/actions'

export default function GenerateInviteButton({ locale }: { locale: string }) {
  const t = useTranslations('profile')
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [lastCode, setLastCode] = useState<string | null>(null)

  const handle = () => {
    startTransition(async () => {
      const code = await generateInvite(locale)
      setLastCode(code)
    })
  }

  const copy = () => {
    if (lastCode) {
      navigator.clipboard.writeText(
        `${window.location.origin}/${locale}/login?code=${lastCode}`
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {lastCode && (
        <button
          onClick={copy}
          className="btn-outline"
          style={{ fontSize: '12px', padding: '0.25rem 0.65rem', color: copied ? 'var(--success)' : undefined }}
        >
          {copied ? t('copied') : t('copy')}
        </button>
      )}
      <button
        onClick={handle}
        disabled={isPending}
        className="btn-primary"
        style={{ fontSize: '12px', padding: '0.3rem 0.8rem' }}
      >
        {isPending ? '...' : t('generateInvite')}
      </button>
    </div>
  )
}
