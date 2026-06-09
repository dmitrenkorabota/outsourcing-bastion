'use client'

import { useTransition, useState } from 'react'
import { generateAdminInvite } from '@/lib/actions'

export default function GenerateAdminInviteButton({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [lastCode, setLastCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handle = () => {
    setError(null)
    startTransition(async () => {
      try {
        const code = await generateAdminInvite(locale)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button
        onClick={handle}
        disabled={isPending}
        className="btn-outline"
        style={{
          justifyContent: 'center',
          fontSize: '13px',
          color: 'var(--gold)',
          borderColor: 'rgba(245,158,11,0.4)',
        }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        {isPending
          ? '...'
          : (locale === 'ru' ? 'Создать инвайт для администратора' : 'Generate admin invite')}
      </button>

      {error && (
        <p style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</p>
      )}

      {lastCode && (
        <div style={{
          padding: '12px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700,
              padding: '2px 6px', borderRadius: '4px',
              background: 'rgba(245,158,11,0.15)',
              color: 'var(--gold)',
              border: '1px solid rgba(245,158,11,0.3)',
              textTransform: 'uppercase',
            }}>
              Admin
            </span>
            <code style={{
              fontSize: '14px',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 700,
              color: 'var(--gold)',
              letterSpacing: '0.1em',
            }}>
              {lastCode}
            </code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              flex: 1,
              fontSize: '11px',
              color: 'var(--text-4)',
              fontFamily: 'ui-monospace, monospace',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '5px 8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              .../login?code={lastCode}
            </div>
            <button
              onClick={copy}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.15)',
                color: copied ? 'var(--success)' : 'var(--gold)',
                borderColor: copied ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {copied ? (locale === 'ru' ? 'Скопировано!' : 'Copied!') : (locale === 'ru' ? 'Скопировать ссылку' : 'Copy link')}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-4)', margin: 0 }}>
            {locale === 'ru'
              ? 'Человек зарегистрируется как администратор'
              : 'This person will register as administrator'}
          </p>
        </div>
      )}
    </div>
  )
}
