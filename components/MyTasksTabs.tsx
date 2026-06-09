'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function MyTasksTabs({ locale, activeTab }: { locale: string; activeTab: string }) {
  const t = useTranslations('myTasks')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.4rem 1rem',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s',
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text-1)' : 'var(--text-3)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
    border: active ? '1px solid var(--border)' : '1px solid transparent',
  })

  return (
    <div style={{
      display: 'inline-flex',
      gap: '4px',
      background: 'var(--bg-elevated)',
      borderRadius: '12px',
      padding: '4px',
      border: '1px solid var(--border)',
    }}>
      <Link href={`/${locale}/my-tasks`} style={tabStyle(activeTab === 'client')}>
        {t('asClient')}
      </Link>
      <Link href={`/${locale}/my-tasks?tab=executor`} style={tabStyle(activeTab === 'executor')}>
        {t('asExecutor')}
      </Link>
    </div>
  )
}
