'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { createTask } from '@/lib/actions'

const CATEGORIES = ['design', 'development', 'translation', 'writing', 'marketing', 'data', 'other']

export default function CreateTaskForm({ balance, locale }: { balance: number; locale: string }) {
  const t = useTranslations('createTask')
  const [reward, setReward] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = balance - reward
  const notEnough = reward > balance

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('locale', locale)
    try {
      await createTask(fd)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      setPending(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-2)',
    marginBottom: '6px',
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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

        {/* Title */}
        <div>
          <label style={labelStyle}>{t('fields.title')} <span style={{ color: 'var(--accent-bright)' }}>*</span></label>
          <input
            name="title"
            required
            maxLength={100}
            className="input"
            placeholder={t('fields.titlePlaceholder')}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>{t('fields.description')} <span style={{ color: 'var(--accent-bright)' }}>*</span></label>
          <textarea
            name="description"
            required
            className="input"
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder={t('fields.descriptionPlaceholder')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Category */}
          <div>
            <label style={labelStyle}>{t('fields.category')}</label>
            <select name="category" className="input">
              <option value="">{t('fields.categoryPlaceholder')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`categories.${c}`)}</option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label style={labelStyle}>{t('fields.deadline')}</label>
            <input
              name="deadline"
              type="date"
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label style={labelStyle}>{t('fields.tags')}</label>
          <input
            name="tags"
            className="input"
            placeholder={t('fields.tagsPlaceholder')}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '5px' }}>
            {locale === 'ru' ? 'Через запятую' : 'Comma-separated'}
          </p>
        </div>

        {/* Reward */}
        <div>
          <label style={labelStyle}>{t('fields.reward')} <span style={{ color: 'var(--accent-bright)' }}>*</span></label>
          <input
            name="reward"
            type="number"
            required
            min={1}
            className={`input ${notEnough ? 'error' : ''}`}
            placeholder={t('fields.rewardPlaceholder')}
            value={reward || ''}
            onChange={(e) => setReward(parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Balance preview */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{t('balance')}</span>
            <span className="coin-chip">{balance} ✦</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{t('willFreeze')}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-bright)' }}>{reward} ✦</span>
          </div>
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: notEnough ? 'var(--danger)' : 'var(--text-2)' }}>
              {t('remainingAfter')}
            </span>
            <span style={{
              fontSize: '14px', fontWeight: 700,
              color: notEnough ? 'var(--danger)' : 'var(--text-1)',
            }}>
              {remaining} ✦
            </span>
          </div>
          {notEnough && (
            <p style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 500 }}>{t('notEnough')}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending || notEnough || reward <= 0}
          className="btn-primary"
          style={{ justifyContent: 'center', padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          {pending ? (
            <span style={{ opacity: 0.7 }}>{locale === 'ru' ? 'Публикую...' : 'Publishing...'}</span>
          ) : (
            t('submit')
          )}
        </button>
      </div>
    </form>
  )
}
