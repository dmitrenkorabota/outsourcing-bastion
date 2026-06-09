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
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top row: status + reward */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <TaskStatusBadge status={task.status} />
          {task.category && (
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}>
              {task.category}
            </span>
          )}
        </div>
        <div className="coin-chip" style={{ flexShrink: 0 }}>
          {task.reward} ✦
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          lineHeight: 1.35,
          color: 'var(--text-1)',
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.15s',
        }}
        className=""
      >
        {task.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.8125rem',
        color: 'var(--text-3)',
        lineHeight: 1.55,
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '0.15rem 0.5rem',
                borderRadius: '99px',
                background: 'var(--bg-surface)',
                color: 'var(--text-3)',
                border: '1px solid var(--border)',
              }}
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span style={{ fontSize: '11px', color: 'var(--text-4)', alignSelf: 'center' }}>
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
        paddingTop: '12px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
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
            {initial}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{posterName}</span>
        </div>

        {deadlineText && (
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: isOverdue ? 'var(--danger)' : 'var(--text-4)',
          }}>
            {deadlineText}
          </span>
        )}
      </div>

      {/* Hover accent line */}
      <div
        className="group-hover:opacity-100"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--accent), var(--accent-bright))',
          opacity: 0,
          transition: 'opacity 0.2s',
          borderRadius: '16px 16px 0 0',
        }}
      />
    </Link>
  )
}
