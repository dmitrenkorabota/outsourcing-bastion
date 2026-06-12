import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    ratingCount: number
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
        photoUrl: true, coins: true, rating: true, ratingCount: true,
        isAdmin: true, createdAt: true, invitedById: true,
      },
    })

    if (!currentUser) redirect(`/${locale}/login`)

    const [inviter, invitees] = await Promise.all([
      currentUser.invitedById
        ? db.user.findUnique({
            where: { id: currentUser.invitedById },
            select: {
              id: true, firstName: true, lastName: true, username: true,
              photoUrl: true, coins: true, rating: true, ratingCount: true,
              isAdmin: true, createdAt: true,
              _count: { select: { tasksPosted: true, tasksTaken: true } },
            },
          })
        : null,
      db.user.findMany({
        where: { invitedById: session.userId },
        select: {
          id: true, firstName: true, lastName: true, username: true,
          photoUrl: true, coins: true, rating: true, ratingCount: true,
          isAdmin: true, createdAt: true,
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

  const fullName = (u: Member) =>
    `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div className="anim-up" style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
          marginBottom: '4px',
        }}>
          {locale === 'ru' ? 'Участники' : 'Members'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          {locale === 'ru'
            ? `${members.length} ${members.length === 1 ? 'участник' : members.length < 5 ? 'участника' : 'участников'} в вашем рабочем пространстве`
            : `${members.length} member${members.length !== 1 ? 's' : ''} in your workspace`}
        </p>
      </div>

      {members.length === 0 ? (
        <div
          className="anim-up d1"
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
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: '4px', fontSize: '14px' }}>
            {locale === 'ru' ? 'Пока никого нет' : 'No members yet'}
          </p>
          <p style={{ color: 'var(--text-4)', fontSize: '12px' }}>
            {locale === 'ru'
              ? 'Отправьте инвайт-ссылку из профиля'
              : 'Share an invite link from your profile'}
          </p>
        </div>
      ) : (
        <div className="anim-up d1" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 90px 80px',
            gap: '0',
            padding: '10px 18px',
            borderBottom: '1px solid var(--border)',
          }}>
            {[
              locale === 'ru' ? 'Участник' : 'Member',
              locale === 'ru' ? 'Роль' : 'Role',
              locale === 'ru' ? 'Монеты' : 'Coins',
              locale === 'ru' ? 'Задач' : 'Tasks',
            ].map((h) => (
              <div key={h} style={{
                fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-4)',
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Member rows */}
          {members.map((member, i) => {
            const isSelf = member.role === 'self'
            const isInviter = member.role === 'inviter'
            const initial = member.firstName[0].toUpperCase()

            return (
              <div
                key={member.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 90px 80px',
                  gap: '0',
                  padding: '13px 18px',
                  borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  background: isSelf ? 'rgba(20,184,166,0.03)' : 'transparent',
                  transition: 'background 0.12s',
                }}
                className="row-hover"
              >
                {/* Member info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                  {/* Avatar */}
                  {member.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photoUrl}
                      alt={member.firstName}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: '32px', height: '32px',
                      borderRadius: '50%',
                      background: isSelf ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: '1px solid ' + (isSelf ? 'var(--accent-border)' : 'var(--border)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700,
                      color: isSelf ? 'var(--accent-bright)' : 'var(--text-3)',
                      flexShrink: 0,
                    }}>
                      {initial}
                    </div>
                  )}

                  {/* Name + meta */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Link
                        href={`/${locale}/profile/${member.id}`}
                        style={{
                          fontSize: '13px', fontWeight: 500,
                          color: 'var(--text-1)',
                          textDecoration: 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {fullName(member)}
                      </Link>
                      {isSelf && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          padding: '1px 5px', borderRadius: '3px',
                          background: 'var(--accent-dim)',
                          color: 'var(--accent-bright)',
                          border: '1px solid var(--accent-border)',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}>
                          {locale === 'ru' ? 'вы' : 'you'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '1px' }}>
                      {member.username && `@${member.username} · `}
                      {locale === 'ru' ? 'с' : 'since'}{' '}
                      {new Date(member.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', year: 'numeric' })}
                      {isInviter && ` · ${locale === 'ru' ? 'пригласил вас' : 'invited you'}`}
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div>
                  {member.isAdmin ? (
                    <span style={{
                      fontSize: '10px', fontWeight: 600,
                      padding: '2px 7px', borderRadius: '4px',
                      background: 'rgba(232,151,26,0.08)',
                      color: 'var(--gold)',
                      border: '1px solid rgba(232,151,26,0.16)',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      Admin
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                      {locale === 'ru' ? 'Участник' : 'Member'}
                    </span>
                  )}
                </div>

                {/* Coins */}
                <div>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 700,
                    fontSize: '13px', color: 'var(--gold)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {member.coins}
                    <span style={{ color: 'var(--text-4)', fontWeight: 400, fontSize: '11px', marginLeft: '2px' }}>✦</span>
                  </span>
                </div>

                {/* Tasks */}
                <div>
                  {member._count ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                      {member._count.tasksPosted + member._count.tasksTaken}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>—</span>
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
