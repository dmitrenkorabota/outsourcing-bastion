'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import LocaleSwitcher from './LocaleSwitcher'

type User = {
  id: number
  firstName: string
  lastName: string | null
  username: string | null
  photoUrl: string | null
  coins: number
  isAdmin: boolean
}

export default function Header({ user, locale }: { user: User | null; locale: string }) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: `/${locale}`, label: t('exchange') },
    ...(user ? [
      { href: `/${locale}/members`, label: t('members') },
      { href: `/${locale}/my-tasks`, label: t('myTasks') },
      { href: `/${locale}/profile/${user.id}`, label: t('profile') },
      ...(user.isAdmin ? [{ href: `/${locale}/admin`, label: t('admin') }] : []),
    ] : []),
  ]

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(9,9,11,0.82)',
        backdropFilter: 'blur(14px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.8)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="shrink-0 flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--accent)', boxShadow: '0 0 14px var(--accent-glow)' }}
          >
            OB
          </div>
          <span
            className="font-semibold text-sm tracking-tight hidden sm:block"
            style={{ color: 'var(--text-1)' }}
          >
            Outsourcing<span className="gradient-text">Bastion</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 ml-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== `/${locale}` && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                  background: isActive ? 'var(--bg-hover)' : 'transparent',
                  transition: 'color 0.15s, background 0.15s',
                  textDecoration: 'none',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-2)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-3)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '16px',
                      height: '2px',
                      borderRadius: '99px',
                      background: 'var(--accent-bright)',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />

          {user ? (
            <>
              {/* Coin balance — always visible */}
              <Link
                href={`/${locale}/profile/${user.id}`}
                className="coin-chip"
                style={{ textDecoration: 'none', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                title={user.firstName}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{user.coins}</span>
                <span style={{ fontSize: '11px', color: 'var(--gold)', opacity: 0.8 }}>✦</span>
              </Link>

              {/* Create task button — desktop */}
              <Link
                href={`/${locale}/tasks/new`}
                className="btn-primary hidden md:flex"
                style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {t('createTask')}
              </Link>

              {/* Avatar chip — desktop */}
              <div
                className="hidden md:flex items-center gap-2"
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '99px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  color: 'var(--text-2)',
                  fontWeight: 500,
                }}
              >
                <div style={{
                  width: '20px', height: '20px',
                  borderRadius: '50%',
                  background: 'var(--accent-glow)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700,
                  color: 'var(--accent-bright)',
                  flexShrink: 0,
                }}>
                  {user.firstName[0].toUpperCase()}
                </div>
                {user.firstName}
                {user.isAdmin && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'var(--accent-glow)',
                    color: 'var(--accent-bright)',
                    border: '1px solid var(--accent-border)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    admin
                  </span>
                )}
              </div>
            </>
          ) : (
            <Link href={`/${locale}/login`} className="btn-primary" style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}>
              {t('login')}
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              background: menuOpen ? 'var(--bg-hover)' : 'transparent',
              border: '1px solid ' + (menuOpen ? 'var(--border-hover)' : 'var(--border)'),
              color: 'var(--text-2)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            aria-label="Menu"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-4 py-3 flex flex-col gap-1 anim-scale-in"
          style={{
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  background: isActive ? 'var(--bg-hover)' : 'transparent',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                {link.label}
              </Link>
            )
          })}
          {user && (
            <Link
              href={`/${locale}/tasks/new`}
              onClick={() => setMenuOpen(false)}
              className="btn-primary"
              style={{
                marginTop: '4px',
                justifyContent: 'center',
                fontSize: '0.875rem',
              }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t('createTask')}
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
