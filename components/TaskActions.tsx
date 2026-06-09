'use client'

import { useTranslations } from 'next-intl'
import { useTransition, useState } from 'react'
import { takeTask, submitResult, acceptResult, cancelTask, openDispute } from '@/lib/actions'

type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

type Props = {
  taskId: number
  status: TaskStatus
  posterId: number
  executorId: number | null
  currentUserId: number | null
  locale: string
}

export default function TaskActions({ taskId, status, posterId, executorId, currentUserId, locale }: Props) {
  const t = useTranslations('task')
  const [isPending, startTransition] = useTransition()
  const [showResult, setShowResult] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [result, setResult] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!currentUserId) return null

  const isClient = currentUserId === posterId
  const isExecutor = currentUserId === executorId

  const run = (fn: () => Promise<void>) => {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
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

      {/* Executor: take open task */}
      {status === 'OPEN' && !isClient && (
        <button
          onClick={() => run(() => takeTask(taskId, locale))}
          disabled={isPending}
          className="btn-primary"
          style={{ justifyContent: 'center', width: '100%', padding: '0.6rem 1rem' }}
        >
          {isPending ? '...' : t('actions.take')}
        </button>
      )}

      {/* Executor: submit result */}
      {status === 'IN_PROGRESS' && isExecutor && (
        <>
          {!showResult ? (
            <button
              onClick={() => setShowResult(true)}
              className="btn-primary"
              style={{ justifyContent: 'center', width: '100%', padding: '0.6rem 1rem' }}
            >
              {t('actions.submit')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder={t('resultPlaceholder')}
                className="input"
                style={{ minHeight: '96px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => run(() => submitResult(taskId, result, locale))}
                  disabled={isPending || !result.trim()}
                  className="btn-success"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {t('submit')}
                </button>
                <button onClick={() => setShowResult(false)} className="btn-outline">
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Client: accept result */}
      {status === 'REVIEW' && isClient && (
        <button
          onClick={() => run(() => acceptResult(taskId, locale))}
          disabled={isPending}
          className="btn-success"
          style={{ justifyContent: 'center', width: '100%', padding: '0.6rem 1rem' }}
        >
          {isPending ? '...' : t('actions.accept')}
        </button>
      )}

      {/* Client: cancel task */}
      {['OPEN', 'IN_PROGRESS'].includes(status) && isClient && (
        <button
          onClick={() => run(() => cancelTask(taskId, locale))}
          disabled={isPending}
          className="btn-danger"
          style={{ justifyContent: 'center', width: '100%' }}
        >
          {t('actions.cancel')}
        </button>
      )}

      {/* Both: open dispute */}
      {['IN_PROGRESS', 'REVIEW'].includes(status) && (isClient || isExecutor) && (
        <>
          {!showDispute ? (
            <button
              onClick={() => setShowDispute(true)}
              className="btn-outline"
              style={{
                justifyContent: 'center', width: '100%',
                color: 'var(--warning)',
                borderColor: 'var(--warning-border)',
                fontSize: '13px',
              }}
            >
              {t('actions.dispute')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={locale === 'ru' ? 'Опишите проблему...' : 'Explain the issue...'}
                className="input"
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => run(() => openDispute(taskId, disputeReason, locale))}
                  disabled={isPending || !disputeReason.trim()}
                  className="btn-danger"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {t('submit')}
                </button>
                <button onClick={() => setShowDispute(false)} className="btn-outline">
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
