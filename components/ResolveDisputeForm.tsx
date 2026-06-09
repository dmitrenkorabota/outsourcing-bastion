'use client'

import { useTranslations } from 'next-intl'
import { useTransition, useState } from 'react'
import { resolveDispute } from '@/lib/actions'

export default function ResolveDisputeForm({ disputeId, locale }: { disputeId: number; locale: string }) {
  const t = useTranslations('admin.disputes')
  const [isPending, startTransition] = useTransition()
  const [resolution, setResolution] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resolve = (payExecutor: boolean) => {
    setError(null)
    startTransition(async () => {
      try {
        await resolveDispute(disputeId, resolution, payExecutor, locale)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      <textarea
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder={t('resolutionPlaceholder')}
        className="input"
        style={{ minHeight: '64px', resize: 'none', fontSize: '13px' }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => resolve(false)}
          disabled={isPending || !resolution.trim()}
          className="btn-outline"
          style={{
            flex: 1, justifyContent: 'center', fontSize: '13px',
            color: 'var(--accent-bright)',
            borderColor: 'var(--accent-border)',
          }}
        >
          {t('refundClient')}
        </button>
        <button
          onClick={() => resolve(true)}
          disabled={isPending || !resolution.trim()}
          className="btn-success"
          style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}
        >
          {t('payExecutor')}
        </button>
      </div>
    </div>
  )
}
