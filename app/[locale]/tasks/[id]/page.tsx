import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { DEMO_TASKS, DEMO_USER } from '@/lib/demo'
import TaskStatusBadge from '@/components/TaskStatusBadge'
import TaskActions from '@/components/TaskActions'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export default async function TaskPage({ params }: Props) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'task' })
  const session = await getSession()

  let task: any = null
  try {
    task = await db.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        poster: { select: { id: true, firstName: true, lastName: true, username: true, rating: true } },
        executor: { select: { id: true, firstName: true, username: true, rating: true } },
      },
    })
  } catch {
    const found = DEMO_TASKS.find((t) => t.id === parseInt(id))
    if (found) {
      task = {
        ...found,
        result: null,
        poster: { ...found.poster, lastName: null, rating: 4.8 },
        executor: found.executorId
          ? { id: DEMO_USER.id, firstName: DEMO_USER.firstName, username: DEMO_USER.username, rating: 4.5 }
          : null,
      }
    }
  }

  if (!task) notFound()

  const daysLeft = task.deadline
    ? Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const deadlineText = task.deadline
    ? daysLeft != null && daysLeft < 0
      ? t('overdue')
      : t('daysLeft', { days: daysLeft ?? 0 })
    : t('noDeadline')

  const isOverdue = daysLeft != null && daysLeft < 0

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>

      {/* Back link */}
      <Link
        href={`/${locale}`}
        className="anim-up link-muted"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          marginBottom: '24px',
        }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {locale === 'ru' ? 'Назад к бирже' : 'Back to exchange'}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="lg-two-col">
        <style>{`@media(min-width:1024px){.lg-two-col{grid-template-columns:1fr 320px!important}}`}</style>

        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header card */}
          <div className="card anim-up" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <TaskStatusBadge status={task.status} />
                {task.category && (
                  <span style={{
                    fontSize: '12px', fontWeight: 500,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-3)',
                    border: '1px solid var(--border)',
                  }}>
                    {task.category}
                  </span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>#{task.id}</span>
              </div>
              <div className="coin-chip" style={{ fontSize: '1rem', fontWeight: 700, padding: '0.35rem 0.85rem' }}>
                {task.reward} ✦
              </div>
            </div>

            <h1 style={{
              fontSize: 'clamp(20px, 3vw, 26px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-1)',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}>
              {task.title}
            </h1>

            <p style={{
              fontSize: '0.9375rem',
              color: 'var(--text-2)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {task.description}
            </p>

            {task.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                {task.tags.map((tag: string) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '99px',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-3)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Result card */}
          {task.result && (
            <div
              className="card anim-up d2"
              style={{
                padding: '1.5rem',
                borderColor: 'var(--success-border)',
                background: 'linear-gradient(to bottom, rgba(16,185,129,0.05), var(--bg-card))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: '50%',
                  background: 'var(--success-dim)',
                  border: '1px solid var(--success-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: 'var(--success)' }}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>{t('result')}</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {task.result}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Info card */}
          <div className="card anim-up d2" style={{ padding: '1.25rem' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>
              {locale === 'ru' ? 'Детали задачи' : 'Task details'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Deadline */}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '4px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {t('deadline')}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isOverdue ? 'var(--danger)' : task.deadline ? 'var(--text-1)' : 'var(--text-3)',
                }}>
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                    : t('noDeadline')}
                </div>
                {task.deadline && (
                  <div style={{ fontSize: '12px', color: isOverdue ? 'var(--danger)' : 'var(--text-4)', marginTop: '2px' }}>
                    {deadlineText}
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              {/* Poster */}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {t('postedBy')}
                </div>
                <Link
                  href={`/${locale}/profile/${task.poster.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    textDecoration: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    transition: 'background 0.15s',
                    margin: '-8px',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700,
                    color: 'var(--accent-bright)',
                    flexShrink: 0,
                  }}>
                    {task.poster.firstName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                      {task.poster.username ? `@${task.poster.username}` : `${task.poster.firstName}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>★ {task.poster.rating.toFixed(1)}</div>
                  </div>
                </Link>
              </div>

              {/* Executor */}
              {task.executor && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {t('takenBy')}
                    </div>
                    <Link
                      href={`/${locale}/profile/${task.executor.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '9px',
                        textDecoration: 'none',
                        padding: '8px',
                        borderRadius: '8px',
                        margin: '-8px',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: 'var(--success-dim)',
                        border: '1px solid var(--success-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700,
                        color: 'var(--success)',
                        flexShrink: 0,
                      }}>
                        {task.executor.firstName[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                          {task.executor.username ? `@${task.executor.username}` : task.executor.firstName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>★ {task.executor.rating.toFixed(1)}</div>
                      </div>
                    </Link>
                  </div>
                </>
              )}

              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                {locale === 'ru' ? 'Создано' : 'Created'}{' '}
                {new Date(task.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
              </div>
            </div>
          </div>

          {/* Actions card */}
          <div className="card anim-up d3" style={{ padding: '1.25rem' }}>
            <TaskActions
              taskId={task.id}
              status={task.status}
              posterId={task.posterId}
              executorId={task.executorId}
              currentUserId={session?.userId ?? null}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
