import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import GenerateInviteButton from '@/components/GenerateInviteButton'
import CopyInviteLink from '@/components/CopyInviteLink'
import EditProfileForm from '@/components/EditProfileForm'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

const DEMO_PROFILE = {
  id: 1,
  firstName: 'Иван', lastName: 'Петров', username: 'ivan_p',
  bio: null as string | null,
  coins: 580, rating: 4.7, ratingCount: 12,
  skills: ['Next.js', 'Design', 'Translation'],
  isAdmin: false, createdAt: new Date('2024-01-15'),
  transactions: [
    { id: 1, amount: 200, type: 'TASK_PAYMENT', note: 'Оплата задачи', createdAt: new Date(), task: { id: 3, title: 'Настроить CI/CD pipeline' } },
    { id: 2, amount: -150, type: 'TASK_ESCROW', note: 'Заморожено по задаче #1', createdAt: new Date(Date.now() - 86400000), task: { id: 1, title: 'Нарисовать логотип' } },
    { id: 3, amount: 500, type: 'ADMIN_GRANT', note: 'Начальный баланс', createdAt: new Date('2024-01-15'), task: null },
  ],
  inviteCodes: [
    { id: 1, code: 'DEMO1234', isUsed: true, createdAt: new Date('2024-02-01'), usedAt: new Date('2024-02-05') },
    { id: 2, code: 'XKCD5678', isUsed: false, createdAt: new Date(), usedAt: null },
  ],
}

const TX_COLORS: Record<string, string> = {
  TASK_PAYMENT:  'var(--success)',
  ADMIN_GRANT:   'var(--success)',
  TASK_ESCROW:   'var(--danger)',
  TASK_REFUND:   'var(--warning)',
  DEPOSIT:       'var(--success)',
}

export default async function ProfilePage({ params }: Props) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'profile' })
  const session = await getSession()

  let user: typeof DEMO_PROFILE | null = null
  let completedAsExecutor = 0
  let totalPosted = 0

  try {
    const dbUser = await db.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { task: { select: { id: true, title: true } } },
        },
        inviteCodes: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (dbUser) {
      user = dbUser as any
      completedAsExecutor = await db.task.count({ where: { executorId: dbUser.id, status: 'COMPLETED' } })
      totalPosted = await db.task.count({ where: { posterId: dbUser.id } })
    }
  } catch {
    user = DEMO_PROFILE
    completedAsExecutor = 3
    totalPosted = 5
  }

  if (!user) notFound()

  const isOwn = session?.userId === user.id

  const statBox = (value: string | number, label: string, color: string) => (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="profile-grid">
        <style>{`@media(min-width:1024px){.profile-grid{grid-template-columns:280px 1fr!important}}`}</style>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* User card */}
          <div
            className="card anim-up"
            style={{ padding: '1.75rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
          >
            {/* Glow behind avatar */}
            <div style={{
              position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
              width: '120px', height: '120px',
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div
              style={{
                width: '72px', height: '72px',
                borderRadius: '50%',
                background: 'var(--accent-glow)',
                border: '2px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', fontWeight: 700,
                color: 'var(--accent-bright)',
                margin: '0 auto 14px',
                position: 'relative',
              }}
            >
              {user.firstName[0]}
            </div>

            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>
              {user.firstName} {user.lastName ?? ''}
            </h1>
            {user.username && (
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '3px' }}>@{user.username}</p>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '6px' }}>
              {t('memberSince')} {new Date(user.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
            </p>

            {(user as any).bio && (
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '12px', lineHeight: 1.6, textAlign: 'left' }}>
                {(user as any).bio}
              </p>
            )}

            {isOwn && (
              <EditProfileForm
                initialBio={(user as any).bio ?? null}
                initialSkills={user.skills}
                locale={locale}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '18px' }}>
              {statBox(user.coins, `✦ ${t('balance')}`, 'var(--gold)')}
              {statBox(user.ratingCount > 0 ? user.rating.toFixed(1) : '—', `★ ${t('rating')}`, 'var(--accent-bright)')}
              {statBox(completedAsExecutor, locale === 'ru' ? 'Выполнено' : 'Done', 'var(--success)')}
              {statBox(totalPosted, locale === 'ru' ? 'Размещено' : 'Posted', 'var(--text-2)')}
            </div>
          </div>

          {/* Skills */}
          <div className="card anim-up d2" style={{ padding: '1.25rem' }}>
            <div className="section-label" style={{ marginBottom: '12px' }}>{t('skills')}</div>
            {user.skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {user.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '0.25rem 0.7rem',
                      borderRadius: '99px',
                      background: 'var(--accent-glow)',
                      color: 'var(--accent-bright)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                {locale === 'ru' ? 'Навыки не указаны' : 'No skills listed'}
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Invite codes (own profile) */}
          {isOwn && (
            <div className="card anim-up d1" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div className="section-label">{t('invites')}</div>
                <GenerateInviteButton locale={locale} />
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '14px' }}>
                {locale === 'ru'
                  ? 'Отправьте ссылку человеку — он зайдёт на сайт и зарегистрируется через Telegram'
                  : 'Send the link to someone — they visit the site and sign in with Telegram'}
              </p>

              {user.inviteCodes.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>{t('noInvites')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {user.inviteCodes.map((invite) => (
                    <div
                      key={invite.id}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${invite.isUsed ? 'var(--border)' : 'var(--accent-border)'}`,
                        opacity: invite.isUsed ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: invite.isUsed ? 0 : '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <code style={{
                            fontSize: '13px',
                            fontFamily: 'ui-monospace, "SF Mono", monospace',
                            fontWeight: 700,
                            color: invite.isUsed ? 'var(--text-3)' : 'var(--accent-bright)',
                            letterSpacing: '0.08em',
                          }}>
                            {invite.code}
                          </code>
                          <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                            {new Date(invite.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                          </span>
                        </div>
                        <span className={`badge ${invite.isUsed ? 'badge-cancelled' : 'badge-open'}`}>
                          {invite.isUsed
                            ? (locale === 'ru' ? 'Использован' : 'Used')
                            : (locale === 'ru' ? 'Активен' : 'Active')}
                        </span>
                      </div>

                      {!invite.isUsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1,
                            fontSize: '11px',
                            color: 'var(--text-4)',
                            fontFamily: 'ui-monospace, monospace',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            .../login?code={invite.code}
                          </div>
                          <CopyInviteLink code={invite.code} locale={locale} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transaction history */}
          <div className="card anim-up d2" style={{ padding: '1.25rem' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>{t('history')}</div>
            {user.transactions.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                {locale === 'ru' ? 'Транзакций пока нет' : 'No transactions yet'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {user.transactions.map((tx, i) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 0',
                      borderBottom: i < user!.transactions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
                        {t(`transactions.${tx.type}`)}
                        {tx.task && (
                          <Link
                            href={`/${locale}/tasks/${tx.task.id}`}
                            style={{ color: 'var(--accent-bright)', marginLeft: '6px', fontSize: '12px', textDecoration: 'none' }}
                          >
                            #{tx.task.id}
                          </Link>
                        )}
                      </div>
                      {tx.note && (
                        <div style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '2px' }}>{tx.note}</div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>
                        {new Date(tx.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: TX_COLORS[tx.type] ?? (tx.amount > 0 ? 'var(--success)' : 'var(--danger)'),
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} ✦
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
