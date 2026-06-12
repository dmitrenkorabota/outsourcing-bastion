'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

const TABS = [
  { key: 'disputes', label: 'tabs.disputes' },
  { key: 'moderation', label: 'tabs.moderation' },
  { key: 'users', label: 'tabs.users' },
  { key: 'grant', label: 'tabs.grantCoins' },
]

export default function AdminTabs({ locale, activeTab }: { locale: string; activeTab: string }) {
  const t = useTranslations('admin')

  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      borderBottom: '1px solid var(--border)',
      paddingBottom: '0',
    }}>
      {TABS.map(({ key, label }) => {
        const active = activeTab === key
        return (
          <Link
            key={key}
            href={`/${locale}/admin?tab=${key}`}
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
            {t(label)}
          </Link>
        )
      })}
    </div>
  )
}
