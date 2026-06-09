import { useTranslations } from 'next-intl'

type Status = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

const statusClass: Record<Status, string> = {
  OPEN: 'badge badge-open',
  IN_PROGRESS: 'badge badge-in_progress',
  REVIEW: 'badge badge-review',
  COMPLETED: 'badge badge-completed',
  DISPUTED: 'badge badge-disputed',
  CANCELLED: 'badge badge-cancelled',
}

export default function TaskStatusBadge({ status }: { status: Status }) {
  const t = useTranslations('task.status')
  return <span className={statusClass[status]}>{t(status)}</span>
}
