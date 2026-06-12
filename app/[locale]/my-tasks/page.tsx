import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import TaskStatusBadge from '@/components/TaskStatusBadge'
import MyTasksTabs from '@/components/MyTasksTabs'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}

const STATUS_STRIP: Record<string, string> = {
  OPEN:        'var(--accent)',
  IN_PROGRESS: 'var(--warning)',
  REVIEW:      '#A78BFA',
  COMPLETED:   'var(--success)',
  DISPUTED:    'var(--danger)',
  CANCELLED:   'var(--border)',
}

export default async function MyTasksPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { tab } = await searchParams
  const session = await getSession()
  const t = await getTranslations({ locale, namespace: 'myTasks' })
  const isExecutor = tab === 'executor'

  if (!session) redirect(`/${locale}/login`)

  let tasks: any[] = []
  try {
    tasks = isExecutor
      ? await db.task.findMany({
          where: { executorId: session.userId },
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
          include: { poster: { select: { id: true, firstName: true, username: true } } },
        })
      : await db.task.findMany({
          where: { posterId: session.userId },
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
          include: { executor: { select: { id: true, firstName: true, username: true } } },
        })
  } catch {
    tasks = []
  }

  // Summary stats
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const inReview = tasks.filter((t) => t.status === 'REVIEW').length
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length
  const activeTasks = tasks.filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status))
  const pastTasks = tasks.filter((t) => ['COMPLETED', 'CANCELLED'].includes(t.status))

  const now = Date.now()
  const deadlineUrgency = (deadline: Date | null): 'overdue' | 'soon' | 'ok' | null => {
    if (!deadline) return null
    const diff = Math.ceil((new Date(deadline).getTime() - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'overdue'
    if (diff <= 2) return 'soon'
    return 'ok'
  }

  const deadlineColor: Record<string, string> = {
    overdue: 'var(--danger)',
    soon: 'var(--warning)',
    ok: 'var(--text-4)',
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
          marginBottom: '4px',
        }}>
          {t('title')}
        </h1>

        {/* Quick stats */}
        {tasks.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
            {inProgress > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 500 }}>
                {inProgress} {locale === 'ru' ? 'в работе' : 'in progress'}
              </span>
            )}
            {inReview > 0 && (
              <span style={{ fontSize: '12px', color: '#A78BFA', fontWeight: 500 }}>
                {inReview} {locale === 'ru' ? 'ждут проверки' : 'awaiting review'}
              </span>
            )}
            {completed > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-4)', fontWeight: 500 }}>
                {completed} {locale === 'ru' ? 'завершено' : 'completed'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="anim-up d1" style={{ marginBottom: '1.25rem' }}>
        <MyTasksTabs locale={locale} activeTab={tab ?? 'client'} />
      </div>

      {tasks.length === 0 ? (
        <div
          className="anim-up d2"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '8px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: '6px', fontSize: '14px' }}>
            {t(`empty.${isExecutor ? 'executor' : 'client'}`)}
          </p>
          {!isExecutor && (
            <Link href={`/${locale}/tasks/new`} className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
              {locale === 'ru' ? 'Разместить задачу' : 'Post your first task'}
            </Link>
          )}
        </div>
      ) : (
        <div className="anim-up d2" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Active tasks */}
          {activeTasks.length > 0 && (
            <div>
              {pastTasks.length > 0 && (
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '8px', paddingLeft: '2px' }}>
                  {locale === 'ru' ? 'Активные' : 'Active'}
                </div>
              )}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                {activeTasks.map((task, i) => {
                  const urgency = deadlineUrgency(task.deadline)
                  const counterparty = isExecutor ? task.poster : task.executor
                  return (
                    <Link
                      key={task.id}
                      href={`/${locale}/tasks/${task.id}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '16px',
                        padding: '14px 18px',
                        textDecoration: 'none',
                        borderBottom: i < activeTasks.length - 1 ? '1px solid var(--border)' : 'none',
                        position: 'relative',
                        transition: 'background 0.12s',
                        alignItems: 'center',
                      }}
                      className="row-hover"
                    >
                      {/* Status strip */}
                      <div style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: '2px',
                        background: STATUS_STRIP[task.status] ?? 'var(--border)',
                      }} />

                      <div style={{ paddingLeft: '6px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <TaskStatusBadge status={task.status} />
                          {task.status === 'REVIEW' && !isExecutor && (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#A78BFA' }}>
                              {locale === 'ru' ? '↑ нужна проверка' : '↑ review needed'}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '13px', fontWeight: 500,
                          color: 'var(--text-1)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          marginBottom: '4px',
                        }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {counterparty && (
                            <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                              {isExecutor ? (locale === 'ru' ? 'от' : 'from') : (locale === 'ru' ? 'взял' : 'taken by')}{' '}
                              {counterparty.username ? `@${counterparty.username}` : counterparty.firstName}
                            </span>
                          )}
                          {urgency && (
                            <span style={{ fontSize: '11px', fontWeight: 500, color: deadlineColor[urgency] }}>
                              {urgency === 'overdue'
                                ? (locale === 'ru' ? 'просрочено' : 'overdue')
                                : urgency === 'soon'
                                ? (locale === 'ru' ? '< 2 дней' : '< 2 days left')
                                : `${Math.ceil((new Date(task.deadline).getTime() - now) / 86400000)} ${locale === 'ru' ? 'д.' : 'd.'}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span className="coin-chip">{task.reward} ✦</span>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past tasks */}
          {pastTasks.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '8px', paddingLeft: '2px' }}>
                {locale === 'ru' ? 'Завершённые' : 'Completed'}
              </div>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                {pastTasks.map((task, i) => {
                  const counterparty = isExecutor ? task.poster : task.executor
                  return (
                    <Link
                      key={task.id}
                      href={`/${locale}/tasks/${task.id}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '16px',
                        padding: '12px 18px',
                        textDecoration: 'none',
                        borderBottom: i < pastTasks.length - 1 ? '1px solid var(--border)' : 'none',
                        position: 'relative',
                        transition: 'background 0.12s',
                        alignItems: 'center',
                        opacity: 0.7,
                      }}
                      className="row-hover"
                    >
                      <div style={{ paddingLeft: '6px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <TaskStatusBadge status={task.status} />
                        </div>
                        <div style={{
                          fontSize: '13px', fontWeight: 500,
                          color: 'var(--text-2)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {task.title}
                        </div>
                        {counterparty && (
                          <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '3px' }}>
                            {counterparty.username ? `@${counterparty.username}` : counterparty.firstName}
                            {' · '}{new Date(task.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                      <span className="coin-chip" style={{ opacity: 0.6 }}>{task.reward} ✦</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
