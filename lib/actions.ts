'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from './db'
import { getSession } from './session'

async function requireAuth() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function takeTask(taskId: number, locale: string) {
  const session = await requireAuth()

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task || task.status !== 'OPEN') throw new Error('Task not available')
  if (task.posterId === session.userId) throw new Error('Cannot take your own task')

  await db.task.update({
    where: { id: taskId },
    data: {
      status: 'IN_PROGRESS',
      executorId: session.userId,
      takenAt: new Date(),
    },
  })

  revalidatePath(`/${locale}/tasks/${taskId}`)
  revalidatePath(`/${locale}`)
}

export async function submitResult(taskId: number, result: string, locale: string) {
  const session = await requireAuth()

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task || task.status !== 'IN_PROGRESS') throw new Error('Task not in progress')
  if (task.executorId !== session.userId) throw new Error('Not your task')

  await db.task.update({
    where: { id: taskId },
    data: { status: 'REVIEW', result },
  })

  revalidatePath(`/${locale}/tasks/${taskId}`)
}

export async function acceptResult(taskId: number, locale: string) {
  const session = await requireAuth()

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task || task.status !== 'REVIEW') throw new Error('Task not in review')
  if (task.posterId !== session.userId) throw new Error('Not your task')
  if (!task.executorId) throw new Error('No executor')

  await db.$transaction([
    db.task.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    }),
    db.user.update({
      where: { id: task.executorId },
      data: { coins: { increment: task.reward } },
    }),
    db.transaction.create({
      data: {
        userId: task.executorId,
        amount: task.reward,
        type: 'TASK_PAYMENT',
        taskId,
        note: `Payment for task #${taskId}`,
      },
    }),
  ])

  revalidatePath(`/${locale}/tasks/${taskId}`)
  revalidatePath(`/${locale}/my-tasks`)
}

export async function cancelTask(taskId: number, locale: string) {
  const session = await requireAuth()

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error('Task not found')
  if (task.posterId !== session.userId) throw new Error('Not your task')
  if (!['OPEN', 'IN_PROGRESS'].includes(task.status)) throw new Error('Cannot cancel')

  await db.$transaction([
    db.task.update({
      where: { id: taskId },
      data: { status: 'CANCELLED' },
    }),
    db.user.update({
      where: { id: task.posterId },
      data: { coins: { increment: task.reward } },
    }),
    db.transaction.create({
      data: {
        userId: task.posterId,
        amount: task.reward,
        type: 'TASK_REFUND',
        taskId,
        note: `Refund for cancelled task #${taskId}`,
      },
    }),
  ])

  revalidatePath(`/${locale}/tasks/${taskId}`)
  revalidatePath(`/${locale}`)
}

export async function openDispute(taskId: number, reason: string, locale: string) {
  const session = await requireAuth()

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error('Task not found')
  if (task.posterId !== session.userId && task.executorId !== session.userId) {
    throw new Error('Not your task')
  }
  if (!['IN_PROGRESS', 'REVIEW'].includes(task.status)) {
    throw new Error('Cannot dispute this task')
  }

  await db.$transaction([
    db.task.update({ where: { id: taskId }, data: { status: 'DISPUTED' } }),
    db.dispute.create({
      data: {
        taskId,
        raisedById: session.userId,
        reason,
      },
    }),
  ])

  revalidatePath(`/${locale}/tasks/${taskId}`)
}

export async function createTask(formData: FormData) {
  'use server'
  const session = await requireAuth()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const tagsRaw = formData.get('tags') as string
  const reward = parseInt(formData.get('reward') as string)
  const deadlineRaw = formData.get('deadline') as string
  const locale = formData.get('locale') as string

  if (!title || !description || !reward || reward <= 0) {
    throw new Error('Invalid input')
  }

  const user = await db.user.findUnique({ where: { id: session.userId } })
  if (!user || user.coins < reward) throw new Error('Insufficient coins')

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const task = await db.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title,
        description,
        category: category || null,
        tags,
        reward,
        posterId: session.userId,
        deadline: deadlineRaw ? new Date(deadlineRaw) : null,
      },
    })
    await tx.user.update({
      where: { id: session.userId },
      data: { coins: { decrement: reward } },
    })
    await tx.transaction.create({
      data: {
        userId: session.userId,
        amount: -reward,
        type: 'TASK_ESCROW',
        taskId: created.id,
        note: `Escrow for task #${created.id}`,
      },
    })
    return created
  })

  redirect(`/${locale}/tasks/${task.id}`)
}

export async function generateInvite(locale: string) {
  const session = await requireAuth()

  const unusedCount = await db.inviteCode.count({
    where: { createdById: session.userId, isUsed: false },
  })
  if (unusedCount >= 3) throw new Error('Invite limit reached (max 3 active)')

  const code = Math.random().toString(36).slice(2, 10).toUpperCase()
  await db.inviteCode.create({
    data: { code, createdById: session.userId },
  })
  revalidatePath(`/${locale}/profile/${session.userId}`)
  return code
}

export async function grantCoins(formData: FormData) {
  'use server'
  const session = await requireAuth()
  if (!session.isAdmin) throw new Error('Forbidden')

  const userIdOrUsername = formData.get('user') as string
  const amount = parseInt(formData.get('amount') as string)
  const note = formData.get('note') as string
  const locale = formData.get('locale') as string

  const user = await db.user.findFirst({
    where: {
      OR: [
        { id: isNaN(parseInt(userIdOrUsername)) ? undefined : parseInt(userIdOrUsername) },
        { username: userIdOrUsername },
      ],
    },
  })
  if (!user) throw new Error('User not found')

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { coins: { increment: amount } } }),
    db.transaction.create({
      data: {
        userId: user.id,
        amount,
        type: 'ADMIN_GRANT',
        note: note || `Admin grant by #${session.userId}`,
      },
    }),
  ])

  revalidatePath(`/${locale}/admin`)
}

export async function resolveDispute(disputeId: number, resolution: string, payExecutor: boolean, locale: string) {
  const session = await requireAuth()
  if (!session.isAdmin) throw new Error('Forbidden')

  const dispute = await db.dispute.findUnique({
    where: { id: disputeId },
    include: { task: true },
  })
  if (!dispute || dispute.status !== 'OPEN') throw new Error('Dispute not found or already resolved')

  const { task } = dispute

  await db.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: disputeId },
      data: { status: 'RESOLVED', resolution, resolvedAt: new Date() },
    })
    await tx.task.update({
      where: { id: task.id },
      data: { status: 'COMPLETED' },
    })

    if (payExecutor && task.executorId) {
      await tx.user.update({
        where: { id: task.executorId },
        data: { coins: { increment: task.reward } },
      })
      await tx.transaction.create({
        data: {
          userId: task.executorId,
          amount: task.reward,
          type: 'TASK_PAYMENT',
          taskId: task.id,
          note: `Dispute #${disputeId} resolved: paid to executor`,
        },
      })
    } else {
      await tx.user.update({
        where: { id: task.posterId },
        data: { coins: { increment: task.reward } },
      })
      await tx.transaction.create({
        data: {
          userId: task.posterId,
          amount: task.reward,
          type: 'TASK_REFUND',
          taskId: task.id,
          note: `Dispute #${disputeId} resolved: refunded to client`,
        },
      })
    }
  })

  revalidatePath(`/${locale}/admin`)
}
