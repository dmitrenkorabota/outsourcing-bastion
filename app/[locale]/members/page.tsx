import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function MembersPage({ params }: Props) {
  const { locale } = await params
  const session = await getSession()

  if (!session) redirect(`/${locale}/login`)

  type Member = {
    id: number
    firstName: string
    lastName: string | null
    username: string | null
    photoUrl: string | null
    coins: number
    rating: number
    isAdmin: boolean
    createdAt: Date
    _count?: { tasksPosted: number; tasksTaken: number }
    role?: 'inviter' | 'invitee' | 'self'
  }

  let currentUser: (Member & { invitedById: number | null }) | null = null
  let members: Member[] = []

  try {
    currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true, firstName: true, lastName: true, username: true,
        photoUrl: true, coins: true, rating: true, isAdmin: true,
        createdAt: true, invitedById: true,
      },
    })

    if (!currentUser) redirect(`/${locale}/login`)

    const [inviter, invitees] = await Promise.all([
      currentUser.invitedById
        ? db.user.findUnique({
            where: { id: currentUser.invitedById },
            select: {
              id: true, firstName: true, lastName: true, username: true,
              photoUrl: true, coins: true, rating: true, isAdmin: true, createdAt: true,
              _count: { select: { tasksPosted: true, tasksTaken: true } },
            },
          })
        : null,
      db.user.findMany({
        where: { invitedById: session.userId },
        select: {
          id: true, firstName: true, lastName: true, username: true,
          photoUrl: true, coins: true, rating: true, isAdmin: true, createdAt: true,
          _count: { select: { tasksPosted: true, tasksTaken: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    members = [
      ...(inviter ? [{ ...inviter, role: 'inviter' as const }] : []),
      { ...currentUser, _count: undefined, role: 'self' as const },
      ...invitees.map((u) => ({ ...u, role: 'invitee' as const })),
    ]
  } catch {
    members = []
  }

  const displayName = (u: Member) =>
    u.username ? `@${u.username}` : `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: '2rem' }}>
        <div className="section-label" style={{ marginBottom: '10px' }}>
          {locale === 'ru' ? 'Ваша сеть' : 'Your network'}
        </div>
        <h1 style={{
          fontSize: 'clamp(22px, 3vw, 32px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
          marginBottom: '8px',
        }}>
          {locale === 'ru' ? 'Участники' : 'Members'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
          {locale === 'ru'
            ? 'Люди из вашей инвайт-сети'
            : 'People from your invite network'}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ color: 'var(--text-2)', fontWeight: 500, marginBottom: '6px' }}>
            {locale === 'ru' ? 'Пока никого нет' : 'No members yet'}
          </p>
          <p style={{ color: 'var(--text-4)', fontSize: '13px' }}>
            {locale === 'ru'
              ? 'Пригласите людей через инвайт-ссылку в профиле'
              : 'Invite people via your invite link in profile'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((member, i) => {
            const isSelf = member.role === 'self'
            const isInviter = member.role === 'inviter'
            const initial = member.firstName[0].toUpperCase()

            return (
              <div
                key={member.id}
                className={`card anim-up d${Math.min(i + 1, 6) as 1|2|3|4|5|6}`}
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  opacity: 1,
                  outline: isSelf ? '1px solid var(--accent-border)' : 'none',
                }}
              >
                {/* Avatar */}
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photoUrl}
                    alt={member.firstName}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '50%',
                    background: isSelf ? 'var(--accent)' : 'var(--bg-surface)',
                    border: '1px solid ' + (isSelf ? 'var(--accent-border)' : 'var(--border)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700,
                    color: isSelf ? '#fff' : 'var(--text-2)',
                    flexShrink: 0,
                  }}>
                    {initial}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-1)' }}>
                      {displayName(member)}
                    </span>
                    {isSelf && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        padding: '1px 6px', borderRadius: '4px',
                        background: 'var(--accent-glow)',
                        color: 'var(--accent-bright)',
                        border: '1px solid var(--accent-border)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {locale === 'ru' ? 'вы' : 'you'}
                      </span>
                    )}
                    {member.isAdmin && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        padding: '1px 6px', borderRadius: '4px',
                        background: 'rgba(245,158,11,0.15)',
                        color: 'var(--gold)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        admin
                      </span>
                    )}
                    {isInviter && (
                      <span style={{
                        fontSize: '10px', fontWeight: 600,
                        padding: '1px 6px', borderRadius: '4px',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-3)',
                        border: '1px solid var(--border)',
                      }}>
                        {locale === 'ru' ? 'пригласил вас' : 'invited you'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                      {locale === 'ru' ? 'с' : 'since'} {new Date(member.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    {member._count && (
                      <>
                        <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                          {member._count.tasksPosted} {locale === 'ru' ? 'задач' : 'tasks posted'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                          {member._count.tasksTaken} {locale === 'ru' ? 'выполнено' : 'done'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: coins + rating */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  <div className="coin-chip" style={{ fontSize: '13px' }}>
                    {member.coins} ✦
                  </div>
                  {member.rating > 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      ★ {member.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
