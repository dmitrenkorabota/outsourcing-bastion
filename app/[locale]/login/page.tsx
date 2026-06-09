import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getSession } from '@/lib/session'
import TelegramLoginButton from '@/components/TelegramLoginButton'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string }>
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { code } = await searchParams
  const session = await getSession()

  if (session) redirect(`/${locale}`)

  const t = await getTranslations({ locale, namespace: 'auth' })
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? ''

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="anim-scale-in" style={{ width: '100%', maxWidth: '420px' }}>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: '-40px', left: '50%',
            transform: 'translateX(-50%)',
            width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo mark */}
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '20px',
            background: 'var(--accent)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 800,
            color: '#fff',
            margin: '0 auto 20px',
            position: 'relative',
            boxShadow: '0 0 40px var(--accent-glow)',
          }}>
            OB
          </div>

          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-1)',
            marginBottom: '8px',
          }}>
            {t('loginTitle')}
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '28px', lineHeight: 1.5 }}>
            {t('loginSubtitle')}
          </p>

          {/* Registration intent banner */}
          {code ? (
            <div style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '13px',
              color: 'var(--success)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left',
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {locale === 'ru' ? 'Вас пригласили в рабочее пространство' : 'You have been invited to a workspace'}
              <code style={{ marginLeft: 'auto', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', opacity: 0.8 }}>
                {code}
              </code>
            </div>
          ) : (
            <div style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '13px',
              color: 'var(--accent-bright)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left',
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {locale === 'ru'
                ? 'Зарегистрируйтесь и создайте своё рабочее пространство'
                : 'Register and create your own workspace'}
            </div>
          )}

          {botUsername ? (
            <TelegramLoginButton
              botUsername={botUsername}
              inviteCode={code ?? null}
              locale={locale}
            />
          ) : (
            <div style={{
              padding: '10px 14px',
              background: 'var(--danger-dim)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--danger)',
            }}>
              TELEGRAM_BOT_USERNAME not configured
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-4)', marginTop: '16px' }}>
          Outsourcing Bastion — {locale === 'ru' ? 'закрытая платформа' : 'invite-only platform'}
        </p>
      </div>
    </div>
  )
}
