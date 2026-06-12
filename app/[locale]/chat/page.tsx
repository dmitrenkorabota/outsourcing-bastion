import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import ChatWindow from '@/components/ChatWindow'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function ChatPage({ params }: Props) {
  const { locale } = await params
  const session = await getSession()

  if (!session) redirect(`/${locale}/login`)

  let initialMessages: any[] = []
  let memberCount = 0

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true, invitedById: true },
    })

    if (user) {
      const workspaceAdminId = user.isAdmin
        ? session.userId
        : (user.invitedById ?? session.userId)

      ;[initialMessages, memberCount] = await Promise.all([
        db.message.findMany({
          where: { workspaceAdminId },
          orderBy: { createdAt: 'asc' },
          take: 200,
          include: {
            sender: { select: { id: true, firstName: true, username: true } },
          },
        }),
        db.user.count({
          where: {
            OR: [
              { id: workspaceAdminId },
              { invitedById: workspaceAdminId },
            ],
          },
        }),
      ])
    }
  } catch { /* empty */ }

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      <div className="anim-up" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
          marginBottom: '4px',
        }}>
          {locale === 'ru' ? 'Чат' : 'Chat'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          {locale === 'ru'
            ? 'Общайтесь с участниками рабочего пространства'
            : 'Chat with your workspace members'}
        </p>
      </div>

      <div
        className="anim-up d1"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <ChatWindow
          initialMessages={initialMessages}
          currentUserId={session.userId}
          locale={locale}
          memberCount={memberCount}
        />
      </div>
    </div>
  )
}
