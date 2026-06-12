import Link from 'next/link'
import { useTranslations } from 'next-intl'
import TaskStatusBadge from './TaskStatusBadge'

type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

type Task = {
  id: number
  title: string
  description: string
  reward: number
  status: TaskStatus
  category: string | null
  tags: string[]
  deadline: Date | null
  createdAt: Date
  poster: {
    id: number
    firstName: string
    username: string | null
  }
}

export default function TaskCard({ task, locale }: { task: Task; locale: string }) {
  const t = useTranslations('task')

  const isOverdue = task.deadline && new Date(task.deadline) < new Date()

  const deadlineText = (() => {
    if (!task.deadline) return null
    const diff = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return t('overdue')
    return t('daysLeft', { days: diff })
  })()

  const posterName = task.poster.username ? `@${task.poster.username}` : task.poster.firstName
  const initial = task.poster.firstName[0].toUpperCase()

  return (
    <Link
      href={`/${locale}/tasks/${task.id}`}
      className="card card-hover block group"
      style={{
        textDecoration: 'none',
        padding: '1.1rem 1.25rem 1.1rem 1.4rem',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '2px solid rgba(20,184,166,0.25)',
      }}
    >
      {/* Status + category row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <TaskStatusBadge status={task.status} />
        {task.category && (
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
          }}>
            {task.category}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '0.9375rem',
        fontWeight: 700,
        lineHeight: 1.3,
        color: 'var(--text-1)',
        marginBottom: '6px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        letterSpacing: '-0.01em',
      }}>
        {task.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.8rem',
        color: 'var(--text-3)',
        lineHeight: 1.5,
        marginBottom: '14px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {task.description}
      </p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '0.12rem 0.45rem',
              borderRadius: '4px',
              background: 'rgba(20,184,166,0.07)',
              color: 'var(--accent-bright)',
              border: '1px solid rgba(20,184,166,0.15)',
              letterSpacing: '0.02em',
            }}>
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span style={{ fontSize: '10px', color: 'var(--text-4)', alignSelf: 'center' }}>
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '10px',
        borderTop: '1px solid rgba(20,184,166,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '22px', height: '22px',
            borderRadius: '6px',
            background: 'rgba(20,184,166,0.1)',
            border: '1px solid rgba(20,184,166,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 800,
            color: 'var(--accent-bright)',
            flexShrink: 0,
            fontFamily: 'ui-monospace, monospace',
          }}>
            {initial}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{posterName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {deadlineText && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: isOverdue ? 'var(--danger)' : 'var(--text-4)',
              letterSpacing: '0.02em',
            }}>
              {deadlineText}
            </span>
          )}
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.9rem',
            fontWeight: 800,
            color: 'var(--gold)',
            letterSpacing: '-0.02em',
          }}>
            {task.reward} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>✦</span>
          </div>
        </div>
      </div>

      {/* Left border glow on hover */}
      <div
        className="group-hover:opacity-100"
        style={{
          position: 'absolute',
          top: 0, left: -1, bottom: 0,
          width: '2px',
          background: 'linear-gradient(180deg, var(--accent-bright), var(--accent))',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
      />
    </Link>
  )
}
