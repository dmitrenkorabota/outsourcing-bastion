'use client'

import { useState } from 'react'

export default function CopyInviteLink({ code, locale }: { code: string; locale: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const url = `${window.location.origin}/${locale}/login?code=${code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      style={{
        padding: '0.2rem 0.65rem',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        border: '1px solid',
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: copied ? 'var(--success-dim, rgba(34,197,94,0.1))' : 'var(--accent-glow)',
        color: copied ? 'var(--success)' : 'var(--accent-bright)',
        borderColor: copied ? 'var(--success-border, rgba(34,197,94,0.3))' : 'var(--accent-border)',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? (locale === 'ru' ? 'Скопировано' : 'Copied') : (locale === 'ru' ? 'Копировать ссылку' : 'Copy link')}
    </button>
  )
}
