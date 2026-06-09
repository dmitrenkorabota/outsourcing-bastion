'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const CATEGORIES = ['design', 'development', 'translation', 'writing', 'marketing', 'data', 'other']

export default function TaskFilters() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const reset = () => router.push(pathname, { scroll: false })

  const hasFilters = searchParams.toString().length > 0
  const activeCategory = searchParams.get('category') ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Category chips */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => set('category', '')}
          style={{
            padding: '0.3rem 0.85rem',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: !activeCategory ? 'var(--accent)' : 'transparent',
            color: !activeCategory ? '#fff' : 'var(--text-3)',
            borderColor: !activeCategory ? 'var(--accent)' : 'var(--border)',
          }}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => set('category', c === activeCategory ? '' : c)}
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: activeCategory === c ? 'var(--accent-glow)' : 'transparent',
              color: activeCategory === c ? 'var(--accent-bright)' : 'var(--text-3)',
              borderColor: activeCategory === c ? 'var(--accent-border)' : 'var(--border)',
            }}
          >
            {t(`createTask.categories.${c}`)}
          </button>
        ))}
      </div>

      {/* Search row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          padding: '0.65rem 0.85rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Search input */}
        <div style={{ flex: '1 1 200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg
            width="14" height="14"
            fill="none" stroke="currentColor" strokeWidth={2}
            viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '10px', color: 'var(--text-4)', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="input"
            style={{
              paddingLeft: '32px',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: '0.25rem 0.5rem 0.25rem 32px',
            }}
            placeholder={t('exchange.filters.search')}
            defaultValue={searchParams.get('q') ?? ''}
            onChange={(e) => set('q', e.target.value)}
          />
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} className="hidden sm:block" />

        {/* Min reward */}
        <input
          type="number"
          className="input"
          style={{
            width: '110px',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: '0.25rem 0.5rem',
            flexShrink: 0,
          }}
          placeholder={t('exchange.filters.minReward')}
          defaultValue={searchParams.get('minReward') ?? ''}
          onChange={(e) => set('minReward', e.target.value)}
          min={0}
        />

        {/* Max reward */}
        <input
          type="number"
          className="input"
          style={{
            width: '110px',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: '0.25rem 0.5rem',
            flexShrink: 0,
          }}
          placeholder={t('exchange.filters.maxReward')}
          defaultValue={searchParams.get('maxReward') ?? ''}
          onChange={(e) => set('maxReward', e.target.value)}
          min={0}
        />

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} className="hidden sm:block" />

        {/* Sort */}
        <select
          className="input"
          style={{
            width: 'auto',
            minWidth: '140px',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: '0.25rem 2rem 0.25rem 0.5rem',
            flexShrink: 0,
            color: 'var(--text-2)',
          }}
          value={searchParams.get('sort') ?? 'newest'}
          onChange={(e) => set('sort', e.target.value)}
        >
          <option value="newest">{t('exchange.filters.newest')}</option>
          <option value="reward_desc">{t('exchange.filters.reward_desc')}</option>
          <option value="reward_asc">{t('exchange.filters.reward_asc')}</option>
        </select>

        {hasFilters && (
          <button
            onClick={reset}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s',
              display: 'flex', alignItems: 'center', gap: '4px',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
            {t('exchange.filters.reset')}
          </button>
        )}
      </div>
    </div>
  )
}
