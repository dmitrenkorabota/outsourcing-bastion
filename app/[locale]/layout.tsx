import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import Header from '@/components/Header'
import '@/app/globals.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ru' | 'en')) {
    notFound()
  }

  const messages = await getMessages()
  const session = await getSession()

  let user = null
  if (session) {
    try {
      user = await db.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          photoUrl: true,
          coins: true,
          isAdmin: true,
        },
      })
    } catch { /* no db */ }
  }

  return (
    <html lang={locale} className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem('ob-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`
        }} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>
        <NextIntlClientProvider messages={messages}>
          <Header user={user} locale={locale} />
          <main className="flex-1">{children}</main>
          <footer className="text-center py-8 mt-16" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              © {new Date().getFullYear()} Outsourcing Bastion
            </span>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
