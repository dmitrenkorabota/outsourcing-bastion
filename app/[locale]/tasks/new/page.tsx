import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import CreateTaskForm from '@/components/CreateTaskForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function NewTaskPage({ params }: Props) {
  const { locale } = await params
  const session = await getSession()
  if (!session) redirect(`/${locale}/login`)

  let balance = 0
  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { coins: true },
    })
    balance = user?.coins ?? 0
  } catch { /* no db, use 0 */ }

  const t = await getTranslations({ locale, namespace: 'createTask' })

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <div className="anim-up" style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
          marginBottom: '6px',
        }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
          {locale === 'ru' ? 'Опишите задачу, установите вознаграждение и найдите исполнителя' : 'Describe your task, set a reward and find an executor'}
        </p>
      </div>

      <div className="card anim-up d1" style={{ padding: '1.75rem' }}>
        <CreateTaskForm balance={balance} locale={locale} />
      </div>
    </div>
  )
}
