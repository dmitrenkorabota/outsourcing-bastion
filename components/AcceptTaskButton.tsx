'use client'

import { useTransition } from 'react'
import { acceptResult } from '@/lib/actions'

export default function AcceptTaskButton({ taskId, locale }: { taskId: number; locale: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => acceptResult(taskId, locale))}
      disabled={isPending}
      className="btn-success"
      style={{ padding: '0.3rem 0.9rem', fontSize: '12px', fontWeight: 600 }}
    >
      {isPending ? '...' : (locale === 'ru' ? 'Принять' : 'Accept')}
    </button>
  )
}
