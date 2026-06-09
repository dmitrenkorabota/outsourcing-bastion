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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.4rem 1rem',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text-1)' : 'var(--text-3)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
    border: active ? '1px solid var(--border)' : '1px solid transparent',
  })

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      background: 'var(--bg-elevated)',
      borderRadius: '12px',
      padding: '4px',
      border: '1px solid var(--border)',
      flexWrap: 'wrap',
      width: 'fit-content',
    }}>
      {TABS.map(({ key, label }) => (
        <Link key={key} href={`/${locale}/admin?tab=${key}`} style={tabStyle(activeTab === key)}>
          {t(label)}
        </Link>
      ))}
    </div>
  )
}
