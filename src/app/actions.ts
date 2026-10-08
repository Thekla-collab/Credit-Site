'use server'
import { prisma } from '@/lib/prisma'
import { getSession, setSession, clearSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

type Result = { success: boolean; message?: string }

export async function loginStudent(studentId: string, pin: string): Promise<Result> {
  const s = await prisma.student.findUnique({ where: { id: studentId } })
  if (!s || s.pin !== pin.trim()) return { success: false, message: 'Falsche PIN.' }
  setSession(`student:${s.id}`)
  revalidatePath('/')
  return { success: true }
}

export async function loginTeacher(password: string): Promise<Result> {
  if (!process.env.TEACHER_PASSWORD || password !== process.env.TEACHER_PASSWORD)
    return { success: false, message: 'Falsches Passwort.' }
  setSession('teacher')
  revalidatePath('/')
  return { success: true }
}

export async function logout(): Promise<Result> {
  clearSession()
  revalidatePath('/')
  return { success: true }
}

export async function updateCredits(amount: number, reason: string): Promise<Result> {
  if (getSession()?.role !== 'teacher') return { success: false, message: 'Nur für Lehrer.' }
  if (!Number.isInteger(amount) || amount === 0) return { success: false, message: 'Bitte eine ganze Zahl ungleich 0 eingeben.' }
  if (!reason.trim()) return { success: false, message: 'Bitte einen Grund angeben.' }
  const account = await prisma.classAccount.findUnique({ where: { id: 1 } })
  if ((account?.balance ?? 0) + amount < 0) return { success: false, message: 'Der Kontostand darf nicht negativ werden.' }
  await prisma.$transaction([
    prisma.classAccount.update({ where: { id: 1 }, data: { balance: { increment: amount } } }),
    prisma.transaction.create({ data: { amount, reason: reason.trim() } }),
  ])
  revalidatePath('/')
  return { success: true }
}

export async function startPurchaseRequest(itemId: string): Promise<Result> {
  const s = getSession()
  if (s?.role !== 'student') return { success: false, message: 'Bitte als Schüler anmelden.' }
  if (await prisma.purchaseRequest.findFirst({ where: { status: 'OFFEN' } }))
    return { success: false, message: 'Es läuft bereits ein offener Kaufantrag.' }
  const account = await prisma.classAccount.findUnique({ where: { id: 1 } })
  const item = await prisma.shopItem.findUnique({ where: { id: itemId } })
  if (!account || !item || account.balance < item.price)
    return { success: false, message: 'Nicht genug Credits.' }
  const req = await prisma.purchaseRequest.create({
    data: { itemId, approvals: { create: { studentId: s.id } } },
  })
  await executeIfComplete(req.id)
  revalidatePath('/')
  return { success: true }
}

export async function voteApproval(requestId: string): Promise<Result> {
  const s = getSession()
  if (s?.role !== 'student') return { success: false, message: 'Bitte als Schüler anmelden.' }
  const req = await prisma.purchaseRequest.findUnique({ where: { id: requestId }, include: { approvals: true } })
  if (!req || req.status !== 'OFFEN') return { success: false, message: 'Dieser Antrag ist nicht mehr offen.' }
  if (req.approvals.some(a => a.studentId === s.id)) return { success: false, message: 'Du hast schon zugestimmt.' }
  await prisma.approval.create({ data: { studentId: s.id, purchaseRequestId: requestId } })
  await executeIfComplete(requestId)
  revalidatePath('/')
  return { success: true }
}

export async function cancelPurchaseRequest(requestId: string): Promise<Result> {
  if (getSession()?.role !== 'teacher') return { success: false, message: 'Nur für Lehrer.' }
  await prisma.purchaseRequest.updateMany({ where: { id: requestId, status: 'OFFEN' }, data: { status: 'ABGEBROCHEN' } })
  revalidatePath('/')
  return { success: true }
}

// Serverseitige Prüfung: alle Schüler zugestimmt UND genug Credits
async function executeIfComplete(requestId: string) {
  await prisma.$transaction(async (tx) => {
    const total = await tx.student.count()
    const req = await tx.purchaseRequest.findUnique({ where: { id: requestId }, include: { approvals: true, item: true } })
    if (!req || req.status !== 'OFFEN' || req.approvals.length < total) return
    const account = await tx.classAccount.findUnique({ where: { id: 1 } })
    if (!account || account.balance < req.item.price) return
    await tx.classAccount.update({ where: { id: 1 }, data: { balance: { decrement: req.item.price } } })
    await tx.transaction.create({ data: { amount: -req.item.price, reason: `Kauf: ${req.item.title}` } })
    await tx.purchaseRequest.update({ where: { id: requestId }, data: { status: 'GENEHMIGT' } })
  })
}
