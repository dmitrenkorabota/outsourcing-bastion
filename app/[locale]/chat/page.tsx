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

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true, invitedById: true },
    })

    if (user) {
      const workspaceAdminId = user.isAdmin
        ? session.userId
        : (user.invitedById ?? session.userId)

      initialMessages = await db.message.findMany({
        where: { workspaceAdminId },
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: {
          sender: { select: { id: true, firstName: true, username: true } },
        },
      })
    }
  } catch { /* empty */ }

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      <div className="anim-up" style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
          marginBottom: '4px',
        }}>
          {locale === 'ru' ? 'Чат' : 'Chat'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
          {locale === 'ru'
            ? 'Общайтесь с участниками вашего рабочего пространства'
            : 'Chat with your workspace members'}
        </p>
      </div>

      <div className="card anim-up d1" style={{ overflow: 'hidden', padding: 0 }}>
        <ChatWindow
          initialMessages={initialMessages}
          currentUserId={session.userId}
          locale={locale}
        />
      </div>
    </div>
  )
}
