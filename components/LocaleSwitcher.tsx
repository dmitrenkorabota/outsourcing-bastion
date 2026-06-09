'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggle = () => {
    const next = locale === 'ru' ? 'en' : 'ru'
    const newPath = pathname.replace(`/${locale}`, `/${next}`)
    router.push(newPath)
  }

  return (
    <button
      onClick={toggle}
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: 'var(--text-3)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '0.25rem 0.55rem',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-2)'
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-3)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {locale === 'ru' ? 'EN' : 'RU'}
    </button>
  )
}
