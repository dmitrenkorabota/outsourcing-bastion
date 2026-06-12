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
          orderBy: { createdAt: 'desc' },
          include: { poster: { select: { id: true, firstName: true, username: true } } },
        })
      : await db.task.findMany({
          where: { posterId: session.userId },
          orderBy: { createdAt: 'desc' },
          include: { executor: { select: { id: true, firstName: true, username: true } } },
        })
  } catch {
    tasks = []
  }

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
          marginBottom: '4px',
        }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
          {locale === 'ru' ? 'Ваши задачи как клиента и исполнителя' : 'Your tasks as client and executor'}
        </p>
      </div>

      <div className="anim-up d1">
        <MyTasksTabs locale={locale} activeTab={tab ?? 'client'} />
      </div>

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.length === 0 ? (
          <div
            className="card anim-up d2"
            style={{ padding: '4rem 2rem', textAlign: 'center' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              {isExecutor ? (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p style={{ color: 'var(--text-2)', fontWeight: 500, marginBottom: '6px' }}>
              {t(`empty.${isExecutor ? 'executor' : 'client'}`)}
            </p>
            {!isExecutor && (
              <Link href={`/${locale}/tasks/new`} className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {locale === 'ru' ? 'Разместить задачу' : 'Post your first task'}
              </Link>
            )}
          </div>
        ) : (
          tasks.map((task, i) => (
            <Link
              key={task.id}
              href={`/${locale}/tasks/${task.id}`}
              className={`card card-hover anim-up d${Math.min(i + 2, 6) as 2|3|4|5|6}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '14px 18px',
                textDecoration: 'none',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                  <TaskStatusBadge status={task.status} />
                  {task.category && (
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{task.category}</span>
                  )}
                </div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '3px',
                }}>
                  {task.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                  {new Date(task.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                  {isExecutor && task.poster && (
                    <> · {task.poster.username ? `@${task.poster.username}` : task.poster.firstName}</>
                  )}
                  {!isExecutor && task.executor && (
                    <> · {task.executor.username ? `@${task.executor.username}` : task.executor.firstName}</>
                  )}
                </p>
              </div>
              <div className="coin-chip" style={{ flexShrink: 0 }}>{task.reward} ✦</div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
