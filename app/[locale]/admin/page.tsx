import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import AdminTabs from '@/components/AdminTabs'
import ResolveDisputeForm from '@/components/ResolveDisputeForm'
import GrantCoinsForm from '@/components/GrantCoinsForm'
import TaskStatusBadge from '@/components/TaskStatusBadge'
import AcceptTaskButton from '@/components/AcceptTaskButton'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { tab } = await searchParams
  const session = await getSession()

  const t = await getTranslations({ locale, namespace: 'admin' })
  const activeTab = tab ?? 'disputes'

  let openDisputes: any[] = []
  let pendingTasks: any[] = []
  let users: any[] = []

  if (!session?.isAdmin) redirect(`/${locale}/login`)

  try {
    ;[openDisputes, pendingTasks, users] = await Promise.all([
      db.dispute.findMany({
        where: { status: 'OPEN' },
        include: {
          task: { include: { poster: { select: { username: true, firstName: true } } } },
          raisedBy: { select: { username: true, firstName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.task.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'REVIEW', 'DISPUTED'] } },
        include: { poster: { select: { username: true, firstName: true, id: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, firstName: true, lastName: true,
          username: true, coins: true, rating: true,
          isAdmin: true, createdAt: true,
          _count: { select: { tasksPosted: true, tasksTaken: true } },
        },
      }),
    ])
  } catch {
    openDisputes = [{
      id: 1, taskId: 3, reason: 'Исполнитель не выходит на связь уже 2 дня.',
      createdAt: new Date(),
      task: { id: 3, title: 'Настроить CI/CD pipeline', reward: 200, posterId: 4, executorId: 1, poster: { username: null, firstName: 'Дмитрий' } },
      raisedBy: { username: 'ivan_p', firstName: 'Иван' },
    }]
    pendingTasks = [
      { id: 1, title: 'Нарисовать логотип', status: 'OPEN', category: 'design', reward: 150, createdAt: new Date(), poster: { id: 2, username: 'alex_dev', firstName: 'Алексей' } },
      { id: 3, title: 'Настроить CI/CD pipeline', status: 'IN_PROGRESS', category: 'development', reward: 200, createdAt: new Date(), poster: { id: 4, username: null, firstName: 'Дмитрий' } },
      { id: 6, title: 'Сверстать email-шаблон', status: 'REVIEW', category: 'development', reward: 110, createdAt: new Date(), poster: { id: 6, username: 'sv_design', firstName: 'Светлана' } },
    ]
    users = [
      { id: 1, firstName: 'Иван', lastName: 'Петров', username: 'ivan_p', coins: 580, rating: 4.7, isAdmin: false, createdAt: new Date('2024-01-15'), _count: { tasksPosted: 5, tasksTaken: 3 } },
      { id: 2, firstName: 'Алексей', lastName: null, username: 'alex_dev', coins: 320, rating: 4.9, isAdmin: false, createdAt: new Date('2024-02-01'), _count: { tasksPosted: 8, tasksTaken: 1 } },
      { id: 3, firstName: 'Марина', lastName: 'К.', username: 'marina_k', coins: 150, rating: 4.5, isAdmin: false, createdAt: new Date('2024-02-10'), _count: { tasksPosted: 2, tasksTaken: 4 } },
      { id: 0, firstName: 'Admin', lastName: null, username: 'admin', coins: 9999, rating: 5.0, isAdmin: true, createdAt: new Date('2024-01-01'), _count: { tasksPosted: 0, tasksTaken: 0 } },
    ]
  }

  const totalCoins = users.reduce((s, u) => s + u.coins, 0)

  return (
    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: '28px' }}>
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
          {locale === 'ru' ? 'Управление платформой' : 'Platform management'}
        </p>
      </div>

      {/* Stats bar */}
      <div
        className="anim-up d1"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}
      >
        {[
          { label: locale === 'ru' ? 'Споры' : 'Disputes', value: openDisputes.length, color: 'var(--danger)' },
          { label: locale === 'ru' ? 'Активные задачи' : 'Active tasks', value: pendingTasks.length, color: 'var(--accent-bright)' },
          { label: locale === 'ru' ? 'Пользователи' : 'Users', value: users.length, color: 'var(--success)' },
          { label: locale === 'ru' ? 'Монет в системе' : 'Total coins', value: totalCoins, color: 'var(--gold)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="anim-up d2">
        <AdminTabs locale={locale} activeTab={activeTab} />
      </div>

      <div style={{ marginTop: '20px' }}>

        {/* Disputes */}
        {activeTab === 'disputes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {openDisputes.length === 0 ? (
              <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-3)' }}>
                  {locale === 'ru' ? 'Открытых споров нет' : 'No open disputes'}
                </p>
              </div>
            ) : (
              openDisputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderColor: 'var(--danger-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
                        Task #{dispute.taskId}: {dispute.task.title.slice(0, 60)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                        {locale === 'ru' ? 'Открыт' : 'Raised by'}: {dispute.raisedBy.username ? `@${dispute.raisedBy.username}` : dispute.raisedBy.firstName}
                        {' · '}
                        {new Date(dispute.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                      </div>
                    </div>
                    <span className="badge badge-disputed">{locale === 'ru' ? 'Спор' : 'Dispute'}</span>
                  </div>

                  <div style={{
                    background: 'var(--danger-dim)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    marginBottom: '14px',
                  }}>
                    <strong style={{ color: 'var(--danger)' }}>{locale === 'ru' ? 'Причина:' : 'Reason:'}</strong>{' '}
                    {dispute.reason}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>
                    {locale === 'ru' ? 'Вознаграждение' : 'Reward'}:{' '}
                    <strong style={{ color: 'var(--gold)' }}>{dispute.task.reward} ✦</strong>
                    {' · '}
                    {locale === 'ru' ? 'Заказчик' : 'Poster'}:{' '}
                    {dispute.task.poster.username ? `@${dispute.task.poster.username}` : dispute.task.poster.firstName}
                  </div>

                  <ResolveDisputeForm disputeId={dispute.id} locale={locale} />
                </div>
              ))
            )}
          </div>
        )}

        {/* Moderation */}
        {activeTab === 'moderation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="card card-hover"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px 18px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <TaskStatusBadge status={task.status} />
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>#{task.id}</span>
                  </div>
                  <Link
                    href={`/${locale}/tasks/${task.id}`}
                    style={{
                      fontSize: '14px', fontWeight: 600, color: 'var(--text-1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'block', textDecoration: 'none',
                    }}
                  >
                    {task.title}
                  </Link>
                  <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                    {task.poster.username ? `@${task.poster.username}` : task.poster.firstName}
                    {' · '}{new Date(task.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div className="coin-chip">{task.reward} ✦</div>
                  {task.status === 'REVIEW' && (
                    <AcceptTaskButton taskId={task.id} locale={locale} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', locale === 'ru' ? 'Имя' : 'Name', locale === 'ru' ? 'Юзернейм' : 'Username', locale === 'ru' ? 'Монеты' : 'Coins', locale === 'ru' ? 'Рейтинг' : 'Rating', locale === 'ru' ? 'Задач' : 'Posted', locale === 'ru' ? 'Выполнил' : 'Done', 'Admin'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      className="row-hover"
                      style={{
                        borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>#{u.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                        <Link
                          href={`/${locale}/profile/${u.id}`}
                          style={{ color: 'var(--text-1)', textDecoration: 'none' }}
                        >
                          {u.firstName} {u.lastName ?? ''}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{u.username ? `@${u.username}` : '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: 700 }}>{u.coins}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{u.rating.toFixed(1)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{u._count.tasksPosted}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{u._count.tasksTaken}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.isAdmin ? <span className="badge badge-review">Admin</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grant coins */}
        {activeTab === 'grant' && (
          <div style={{ maxWidth: '480px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="section-label" style={{ marginBottom: '16px' }}>
                {locale === 'ru' ? 'Начислить монеты' : 'Grant coins'}
              </div>
              <GrantCoinsForm locale={locale} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
