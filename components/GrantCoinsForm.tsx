'use client'

import { useTranslations } from 'next-intl'
import { useTransition, useState } from 'react'
import { grantCoins } from '@/lib/actions'

export default function GrantCoinsForm({ locale }: { locale: string }) {
  const t = useTranslations('admin.grantCoins')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('locale', locale)
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await grantCoins(fd)
        setSuccess(true)
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      }
    })
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-2)',
    marginBottom: '6px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--danger-dim)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          color: 'var(--danger)',
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--success-dim)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          color: 'var(--success)',
        }}>
          {locale === 'ru' ? 'Монеты начислены!' : 'Coins granted successfully!'}
        </div>
      )}

      <div>
        <label style={labelStyle}>{t('user')}</label>
        <input name="user" required className="input" placeholder="ID or @username" />
      </div>

      <div>
        <label style={labelStyle}>{t('amount')}</label>
        <input name="amount" type="number" required min={1} className="input" placeholder="100" />
      </div>

      <div>
        <label style={labelStyle}>{t('note')}</label>
        <input name="note" className="input" placeholder={locale === 'ru' ? 'Примечание...' : 'Optional note...'} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary"
        style={{ justifyContent: 'center', padding: '0.6rem 1rem' }}
      >
        {isPending ? '...' : t('submit')}
      </button>
    </form>
  )
}
