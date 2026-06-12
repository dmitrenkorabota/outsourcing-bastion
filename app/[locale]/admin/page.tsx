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

  if (!session?.isAdmin) redirect(`/${locale}/login`)

  let openDisputes: any[] = []
  let pendingTasks: any[] = []
  let users: any[] = []

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
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'REVIEW', 'DISPUTED'] },
          OR: [
            { posterId: session.userId },
            { poster: { invitedById: session.userId } },
          ],
        },
        include: {
          poster: { select: { username: true, firstName: true, id: true } },
          executor: { select: { username: true, firstName: true } },
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
        take: 50,
      }),
      db.user.findMany({
        where: {
          OR: [
            { id: session.userId },
            { invitedById: session.userId },
          ],
        },
        orderBy: [{ isAdmin: 'desc' }, { createdAt: 'asc' }],
        take: 100,
        select: {
          id: true, firstName: true, lastName: true,
          username: true, coins: true, rating: true, ratingCount: true,
          isAdmin: true, createdAt: true,
          _count: { select: { tasksPosted: true, tasksTaken: true } },
        },
      }),
    ])
  } catch { /* keep empty arrays */ }

  const totalCoins = users.reduce((s, u) => s + u.coins, 0)
  const reviewCount = pendingTasks.filter((t) => t.status === 'REVIEW').length

  const userName = (u: { username?: string | null; firstName: string }) =>
    u.username ? `@${u.username}` : u.firstName

  const statusColor: Record<string, string> = {
    OPEN: 'var(--accent)',
    IN_PROGRESS: 'var(--warning)',
    REVIEW: '#A78BFA',
    DISPUTED: 'var(--danger)',
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Page header */}
      <div className="anim-up" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {t('title')}
          </h1>
          {reviewCount > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '99px',
              background: 'rgba(139,92,246,0.12)',
              color: '#A78BFA',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              {reviewCount} {locale === 'ru' ? 'ждёт проверки' : 'need review'}
            </span>
          )}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          {locale === 'ru' ? 'Управление рабочим пространством' : 'Workspace management'}
        </p>
      </div>

      {/* Metrics row */}
      <div
        className="anim-up d1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          background: 'var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          border: '1px solid var(--border)',
        }}
      >
        {[
          { label: locale === 'ru' ? 'Открытых споров' : 'Open disputes', value: openDisputes.length, color: openDisputes.length > 0 ? 'var(--danger)' : 'var(--text-1)' },
          { label: locale === 'ru' ? 'На проверке' : 'Awaiting review', value: reviewCount, color: reviewCount > 0 ? '#A78BFA' : 'var(--text-1)' },
          { label: locale === 'ru' ? 'Участников' : 'Members', value: users.length, color: 'var(--text-1)' },
          { label: locale === 'ru' ? 'Монет в обороте' : 'Coins in circulation', value: totalCoins, color: 'var(--gold)' },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: 'var(--bg-card)',
              padding: '18px 20px',
            }}
          >
            <div style={{
              fontSize: '24px', fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
              color: m.color,
              lineHeight: 1,
              marginBottom: '5px',
            }}>
              {m.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="anim-up d2" style={{ marginBottom: '1.25rem' }}>
        <AdminTabs locale={locale} activeTab={activeTab} />
      </div>

      {/* ── Disputes ── */}
      {activeTab === 'disputes' && (
        <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {openDisputes.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}>
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '8px',
                background: 'var(--success-dim)',
                border: '1px solid var(--success-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--success)' }}>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '4px' }}>
                {locale === 'ru' ? 'Открытых споров нет' : 'No open disputes'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                {locale === 'ru' ? 'Всё в порядке' : 'Everything is fine'}
              </p>
            </div>
          ) : (
            openDisputes.map((dispute) => (
              <div
                key={dispute.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {/* Dispute header */}
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className="badge badge-disputed">Dispute</span>
                      <Link
                        href={`/${locale}/tasks/${dispute.taskId}`}
                        style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', textDecoration: 'none' }}
                      >
                        {dispute.task.title.length > 60
                          ? dispute.task.title.slice(0, 60) + '…'
                          : dispute.task.title}
                      </Link>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', display: 'flex', gap: '12px' }}>
                      <span>{locale === 'ru' ? 'Открыл' : 'Raised by'}: {userName(dispute.raisedBy)}</span>
                      <span>{new Date(dispute.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}</span>
                      <span style={{ color: 'var(--gold)' }}>{dispute.task.reward} ✦</span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '5px' }}>
                    {locale === 'ru' ? 'Причина' : 'Reason'}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {dispute.reason}
                  </p>
                </div>

                {/* Resolution form */}
                <div style={{ padding: '14px 18px' }}>
                  <ResolveDisputeForm disputeId={dispute.id} locale={locale} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Moderation ── */}
      {activeTab === 'moderation' && (
        <div className="anim-in">
          {pendingTasks.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
                {locale === 'ru' ? 'Активных задач нет' : 'No active tasks'}
              </p>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 80px 100px',
                gap: '0',
                padding: '10px 18px',
                borderBottom: '1px solid var(--border)',
              }}>
                {[
                  locale === 'ru' ? 'Задача' : 'Task',
                  locale === 'ru' ? 'Статус' : 'Status',
                  locale === 'ru' ? 'Награда' : 'Reward',
                  locale === 'ru' ? 'Действие' : 'Action',
                ].map((h) => (
                  <div key={h} style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {pendingTasks.map((task, i) => (
                <div
                  key={task.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 80px 100px',
                    gap: '0',
                    padding: '12px 18px',
                    borderBottom: i < pendingTasks.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Status strip */}
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: '2px',
                    background: statusColor[task.status] ?? 'var(--border)',
                  }} />

                  {/* Task name */}
                  <div style={{ paddingLeft: '4px', minWidth: 0 }}>
                    <Link
                      href={`/${locale}/tasks/${task.id}`}
                      style={{
                        fontSize: '13px', fontWeight: 500,
                        color: 'var(--text-1)',
                        textDecoration: 'none',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.title}
                    </Link>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>
                      {userName(task.poster)}
                      {task.executor && ` → ${userName(task.executor)}`}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <TaskStatusBadge status={task.status} />
                  </div>

                  {/* Reward */}
                  <div>
                    <span className="coin-chip">{task.reward} ✦</span>
                  </div>

                  {/* Action */}
                  <div>
                    {task.status === 'REVIEW' ? (
                      <AcceptTaskButton taskId={task.id} locale={locale} />
                    ) : (
                      <Link
                        href={`/${locale}/tasks/${task.id}`}
                        style={{
                          fontSize: '11px', fontWeight: 500,
                          color: 'var(--text-3)',
                          textDecoration: 'none',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          transition: 'border-color 0.12s, color 0.12s',
                          display: 'inline-block',
                        }}
                      >
                        {locale === 'ru' ? 'Открыть' : 'View'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Users ── */}
      {activeTab === 'users' && (
        <div className="anim-in">
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', locale === 'ru' ? 'Пользователь' : 'User', locale === 'ru' ? 'Монеты' : 'Coins', locale === 'ru' ? 'Рейтинг' : 'Rating', locale === 'ru' ? 'Задач' : 'Tasks', locale === 'ru' ? 'Роль' : 'Role', locale === 'ru' ? 'С нами с' : 'Member since'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '10px 16px',
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--text-4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      className="row-hover"
                      style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums', fontSize: '11px', fontFamily: 'monospace' }}>
                        {u.id}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '160px' }}>
                        <Link
                          href={`/${locale}/profile/${u.id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <div style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                            {u.firstName}{u.lastName ? ' ' + u.lastName : ''}
                          </div>
                          {u.username && (
                            <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '1px' }}>
                              @{u.username}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace', fontWeight: 700,
                          color: 'var(--gold)', fontVariantNumeric: 'tabular-nums',
                          fontSize: '13px',
                        }}>
                          {u.coins}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-2)', fontSize: '13px' }}>
                        {u.ratingCount > 0 ? (
                          <span>★ {u.rating.toFixed(1)}</span>
                        ) : (
                          <span style={{ color: 'var(--text-4)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                          {u._count.tasksPosted + u._count.tasksTaken}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.isAdmin ? (
                          <span className="badge badge-open">Admin</span>
                        ) : (
                          <span className="badge badge-cancelled">{locale === 'ru' ? 'Участник' : 'Member'}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-4)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {new Date(u.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Grant Coins ── */}
      {activeTab === 'grant' && (
        <div className="anim-in" style={{ maxWidth: '440px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '3px' }}>
                {locale === 'ru' ? 'Начислить монеты' : 'Grant Coins'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {locale === 'ru' ? 'Переводите коины любому участнику' : 'Transfer coins to any member'}
              </p>
            </div>
            <GrantCoinsForm locale={locale} />
          </div>
        </div>
      )}
    </div>
  )
}
