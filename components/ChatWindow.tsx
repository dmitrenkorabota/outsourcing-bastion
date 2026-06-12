'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { sendMessage, getChatMessages } from '@/lib/actions'

type ChatMessage = {
  id: number
  senderId: number
  content: string
  createdAt: Date | string
  sender: { id: number; firstName: string; username: string | null }
}

type Props = {
  initialMessages: ChatMessage[]
  currentUserId: number
  locale: string
  memberCount?: number
}

export default function ChatWindow({ initialMessages, currentUserId, locale, memberCount }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : 0
  )

  // Poll every 3s
  useEffect(() => {
    const poll = async () => {
      try {
        const newer = await getChatMessages(lastIdRef.current)
        if (newer.length > 0) {
          setMessages((prev) => [...prev, ...newer])
          lastIdRef.current = newer[newer.length - 1].id
        }
      } catch { /* ignore */ }
    }
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  const handleSend = () => {
    const content = text.trim()
    if (!content) return
    setText('')
    startTransition(async () => {
      await sendMessage(content, locale)
      const newer = await getChatMessages(lastIdRef.current)
      if (newer.length > 0) {
        setMessages((prev) => [...prev, ...newer])
        lastIdRef.current = newer[newer.length - 1].id
      }
    })
  }

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const fmtDate = (d: Date | string) => {
    const date = new Date(d)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString())
      return locale === 'ru' ? 'Сегодня' : 'Today'
    if (date.toDateString() === yesterday.toDateString())
      return locale === 'ru' ? 'Вчера' : 'Yesterday'
    return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'long',
    })
  }

  // Group by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = []
  for (const msg of messages) {
    const d = fmtDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last?.date === d) last.msgs.push(msg)
    else grouped.push({ date: d, msgs: [msg] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>

      {/* Chat header */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
            {locale === 'ru' ? 'Рабочее пространство' : 'Workspace'}
          </div>
          {memberCount !== undefined && (
            <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '1px' }}>
              {memberCount} {locale === 'ru'
                ? memberCount === 1 ? 'участник' : memberCount < 5 ? 'участника' : 'участников'
                : `member${memberCount !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
            {locale === 'ru' ? 'обновляется' : 'live'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent',
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-4)',
            fontSize: '13px',
            margin: 'auto',
            padding: '3rem 1rem',
            lineHeight: 2,
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>💬</div>
            {locale === 'ru'
              ? 'Сообщений пока нет.\nНачните общение!'
              : 'No messages yet.\nStart the conversation!'}
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date separator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '12px 0 10px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {date}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Messages in group */}
              {msgs.map((msg, mi) => {
                const isOwn = msg.senderId === currentUserId
                const name = msg.sender.username ? `@${msg.sender.username}` : msg.sender.firstName
                const showSender = !isOwn && (mi === 0 || msgs[mi - 1].senderId !== msg.senderId)

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      marginBottom: '2px',
                      marginTop: showSender ? '8px' : '0',
                    }}
                  >
                    {showSender && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--accent-bright)',
                        marginBottom: '3px',
                        paddingLeft: '2px',
                      }}>
                        {name}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                      <div style={{
                        maxWidth: '68%',
                        padding: '8px 12px',
                        borderRadius: isOwn ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                        background: isOwn ? 'var(--accent)' : 'var(--bg-elevated)',
                        border: isOwn ? 'none' : '1px solid var(--border)',
                        color: isOwn ? '#fff' : 'var(--text-1)',
                        fontSize: '13px',
                        lineHeight: 1.55,
                        wordBreak: 'break-word',
                      }}>
                        {msg.content}
                      </div>
                      <span style={{
                        fontSize: '10px',
                        color: 'var(--text-4)',
                        flexShrink: 0,
                        paddingBottom: '2px',
                      }}>
                        {fmt(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={locale === 'ru' ? 'Написать сообщение...' : 'Type a message...'}
          className="input"
          style={{ flex: 1, fontSize: '13px', padding: '0.5rem 0.8rem' }}
          disabled={isPending}
          maxLength={2000}
          autoComplete="off"
        />
        <button
          onClick={handleSend}
          disabled={isPending || !text.trim()}
          className="btn-primary"
          style={{ padding: '0.5rem 0.9rem', flexShrink: 0, gap: '0' }}
          aria-label={locale === 'ru' ? 'Отправить' : 'Send'}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
