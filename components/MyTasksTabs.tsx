'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function MyTasksTabs({ locale, activeTab }: { locale: string; activeTab: string }) {
  const t = useTranslations('myTasks')

  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      borderBottom: '1px solid var(--border)',
    }}>
      {[
        { key: 'client', label: t('asClient'), href: `/${locale}/my-tasks` },
        { key: 'executor', label: t('asExecutor'), href: `/${locale}/my-tasks?tab=executor` },
      ].map(({ key, label, href }) => {
        const active = activeTab === key
        return (
          <Link
            key={key}
            href={href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 0.9rem',
              fontSize: '13px',
              fontWeight: active ? 500 : 400,
              color: active ? 'var(--text-1)' : 'var(--text-3)',
              textDecoration: 'none',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.12s, border-color 0.12s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
