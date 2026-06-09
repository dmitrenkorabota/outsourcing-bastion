import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import TaskCard from '@/components/TaskCard'
import TaskFilters from '@/components/TaskFilters'
import { DEMO_TASKS } from '@/lib/demo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    category?: string
    minReward?: string
    maxReward?: string
    sort?: string
  }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'exchange' })
  return { title: `${t('title')} — Outsourcing Bastion` }
}

async function TaskFeed({
  locale, workspaceAdminId, q, category, minReward, maxReward, sort,
}: {
  locale: string
  workspaceAdminId: number
  q?: string; category?: string
  minReward?: string; maxReward?: string; sort?: string
}) {
  const t = await getTranslations({ locale, namespace: 'exchange' })

  // Workspace: tasks posted by admin + tasks posted by workspace members
  const networkFilter = {
    OR: [
      { posterId: workspaceAdminId },
      { poster: { invitedById: workspaceAdminId } },
    ],
  }

  let tasks: typeof DEMO_TASKS = []

  try {
    const raw = await db.task.findMany({
      where: {
        status: 'OPEN',
        ...networkFilter,
        ...(q && {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
        ...(minReward && { reward: { gte: parseInt(minReward) } }),
        ...(maxReward && { reward: { lte: parseInt(maxReward) } }),
      },
      orderBy:
        sort === 'reward_desc' ? { reward: 'desc' } :
        sort === 'reward_asc'  ? { reward: 'asc' } :
        { createdAt: 'desc' },
      take: 50,
      include: { poster: { select: { id: true, firstName: true, username: true } } },
    })
    tasks = raw as typeof DEMO_TASKS
  } catch {
    tasks = DEMO_TASKS.filter((t) => t.status === 'OPEN')
  }

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        <p style={{ color: 'var(--text-2)', fontWeight: 500, marginBottom: '6px' }}>{t('empty')}</p>
        <p style={{ color: 'var(--text-4)', fontSize: '14px' }}>{t('emptyHint')}</p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}
    >
      {tasks.map((task, i) => (
        <div
          key={task.id}
          className={`anim-up d${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}
        >
          <TaskCard task={task} locale={locale} />
        </div>
      ))}
    </div>
  )
}

export default async function ExchangePage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'exchange' })
  const session = await getSession()

  if (!session) redirect(`/${locale}/login`)

  const userId = session.userId
  const isAdmin = session.isAdmin

  // Determine workspace admin: for admins it's themselves, for members it's who invited them
  let workspaceAdminId = userId
  try {
    if (!isAdmin) {
      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: { invitedById: true },
      })
      workspaceAdminId = currentUser?.invitedById ?? userId
    }
  } catch { /* fallback to userId */ }

  // Count open tasks in this workspace
  let totalOpen = 0
  try {
    totalOpen = await db.task.count({
      where: {
        status: 'OPEN',
        OR: [
          { posterId: workspaceAdminId },
          { poster: { invitedById: workspaceAdminId } },
        ],
      },
    })
  } catch { totalOpen = DEMO_TASKS.filter((t) => t.status === 'OPEN').length }

  return (
    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 1rem' }}>

      {/* Hero */}
      <div
        className="anim-up"
        style={{ position: 'relative', padding: '3.5rem 0 2.5rem', overflow: 'hidden' }}
      >
        <div style={{
          position: 'absolute',
          top: '-60px', left: '50%',
          transform: 'translateX(-50%)',
          width: '500px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div className="section-label anim-up" style={{ marginBottom: '16px' }}>
            {locale === 'ru' ? 'Биржа задач' : 'Task exchange'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <h1
                className="anim-up d1"
                style={{
                  fontSize: 'clamp(28px, 4vw, 44px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  color: 'var(--text-1)',
                  marginBottom: '12px',
                }}
              >
                {t('title')} <span className="gradient-text">/</span>
                <br />
                <span style={{ color: 'var(--text-2)', fontWeight: 500, fontSize: '0.65em' }}>
                  {t('subtitle')}
                </span>
              </h1>

              <div
                className="anim-up d2"
                style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)' }}>{totalOpen}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                    {locale === 'ru' ? 'открытых задач' : 'open tasks'}
                  </span>
                </div>
                <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                    {locale === 'ru' ? 'Платформа работает' : 'Platform active'}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/${locale}/tasks/new`}
              className="btn-primary anim-up d3"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {locale === 'ru' ? 'Разместить задачу' : 'Post Task'}
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="anim-up d3" style={{ marginBottom: '28px' }}>
        <Suspense fallback={null}>
          <TaskFilters />
        </Suspense>
      </div>

      {/* Feed */}
      <Suspense
        fallback={
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="card"
                style={{ height: '200px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton" style={{ height: '20px', width: '80px' }} />
                  <div className="skeleton" style={{ height: '20px', width: '60px' }} />
                </div>
                <div className="skeleton" style={{ height: '18px', width: '90%' }} />
                <div className="skeleton" style={{ height: '14px', width: '70%' }} />
                <div className="skeleton" style={{ height: '14px', width: '55%' }} />
                <div style={{ marginTop: 'auto' }}>
                  <div className="skeleton" style={{ height: '1px', marginBottom: '10px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ height: '14px', width: '80px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '60px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <TaskFeed locale={locale} workspaceAdminId={workspaceAdminId} {...sp} />
      </Suspense>

      <div style={{ height: '4rem' }} />
    </div>
  )
}
