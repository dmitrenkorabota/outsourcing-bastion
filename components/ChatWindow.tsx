'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { sendMessage, getChatMessages } from '@/lib/actions'

type ChatMessage = {
  id: number
  senderId: number
  content: string
  createdAt: Date | string
  sender: {
    id: number
    firstName: string
    username: string | null
  }
}

type Props = {
  initialMessages: ChatMessage[]
  currentUserId: number
  locale: string
}

export default function ChatWindow({ initialMessages, currentUserId, locale }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : 0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)

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

  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, atBottom])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
  }

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
      setAtBottom(true)
    })
  }

  const formatTime = (d: Date | string) =>
    new Date(d).toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (d: Date | string) => {
    const date = new Date(d)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString())
      return locale === 'ru' ? 'Сегодня' : 'Today'
    if (date.toDateString() === yesterday.toDateString())
      return locale === 'ru' ? 'Вчера' : 'Yesterday'
    return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' })
  }

  // Group messages by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = []
  for (const msg of messages) {
    const d = formatDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last?.date === d) last.msgs.push(msg)
    else grouped.push({ date: d, msgs: [msg] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-4)', fontSize: '13px', margin: 'auto', padding: '2rem' }}>
            {locale === 'ru' ? 'Сообщений пока нет. Начните общение!' : 'No messages yet. Start the conversation!'}
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div style={{
              textAlign: 'center',
              margin: '12px 0 8px',
              fontSize: '11px',
              color: 'var(--text-4)',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>
              {date}
            </div>
            {msgs.map((msg) => {
              const isOwn = msg.senderId === currentUserId
              const name = msg.sender.username ? `@${msg.sender.username}` : msg.sender.firstName
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  {!isOwn && (
                    <span style={{ fontSize: '11px', color: 'var(--accent-bright)', marginBottom: '3px', paddingLeft: '2px', fontWeight: 600 }}>
                      {name}
                    </span>
                  )}
                  <div style={{
                    maxWidth: '72%',
                    padding: '9px 13px',
                    borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isOwn
                      ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)'
                      : 'var(--bg-elevated)',
                    border: isOwn ? 'none' : '1px solid var(--border)',
                    color: isOwn ? '#fff' : 'var(--text-1)',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--text-4)',
                    marginTop: '3px',
                    paddingRight: isOwn ? '2px' : '0',
                    paddingLeft: isOwn ? '0' : '2px',
                  }}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
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
          style={{ flex: 1, fontSize: '14px' }}
          disabled={isPending}
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={isPending || !text.trim()}
          className="btn-primary"
          style={{ padding: '0.55rem 1rem', flexShrink: 0 }}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
