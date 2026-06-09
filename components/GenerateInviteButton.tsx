'use client'

import { useTranslations } from 'next-intl'
import { useTransition, useState } from 'react'
import { generateInvite } from '@/lib/actions'

export default function GenerateInviteButton({ locale }: { locale: string }) {
  const t = useTranslations('profile')
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [lastCode, setLastCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handle = () => {
    setError(null)
    startTransition(async () => {
      try {
        const code = await generateInvite(locale)
        setLastCode(code)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  const copy = () => {
    if (lastCode) {
      const url = `${window.location.origin}/${locale}/login?code=${lastCode}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {lastCode && (
          <button
            onClick={copy}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: copied ? 'rgba(34,197,94,0.1)' : 'var(--accent-glow)',
              color: copied ? 'var(--success)' : 'var(--accent-bright)',
              borderColor: copied ? 'rgba(34,197,94,0.3)' : 'var(--accent-border)',
              whiteSpace: 'nowrap',
            }}
          >
            {copied
              ? (locale === 'ru' ? 'Скопировано!' : 'Copied!')
              : (locale === 'ru' ? 'Скопировать ссылку' : 'Copy link')}
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
    </div>
  )
}
