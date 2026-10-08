import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import AppInterface from './AppInterface'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = getSession()
  const [account, students, shopItems, activeRequest, transactions] = await Promise.all([
    prisma.classAccount.findUnique({ where: { id: 1 } }),
    prisma.student.findMany({ orderBy: { name: 'asc' } }),
    prisma.shopItem.findMany({ orderBy: { price: 'asc' } }),
    prisma.purchaseRequest.findFirst({ where: { status: 'OFFEN' }, include: { item: true, approvals: true } }),
    prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
  ])

  const me = session?.role === 'student' ? students.find(s => s.id === session.id) : null
  const role = session?.role === 'teacher' ? 'teacher' : me ? 'student' : null

  return (
    <AppInterface
      role={role}
      meId={me?.id ?? null}
      meName={me?.name ?? null}
      balance={account?.balance ?? 0}
      students={students.map(s => ({ id: s.id, name: s.name }))}
      pins={role === 'teacher' ? students.map(s => ({ name: s.name, pin: s.pin })) : []}
      shopItems={shopItems}
      activeRequest={activeRequest && {
        id: activeRequest.id,
        item: activeRequest.item,
        approvedIds: activeRequest.approvals.map(a => a.studentId),
      }}
      transactions={transactions.map(t => ({ id: t.id, amount: t.amount, reason: t.reason, createdAt: t.createdAt.toISOString() }))}
    />
  )
}
