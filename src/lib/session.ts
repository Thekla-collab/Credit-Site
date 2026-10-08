import { cookies } from 'next/headers'
import crypto from 'crypto'

const SECRET = process.env.SESSION_SECRET || 'dev-secret'
const sign = (v: string) => crypto.createHmac('sha256', SECRET).update(v).digest('hex')

export type Session = { role: 'teacher' } | { role: 'student'; id: string } | null

export function setSession(value: string) {
  cookies().set('session', `${value}.${sign(value)}`, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12,
  })
}
export function clearSession() { cookies().delete('session') }

export function getSession(): Session {
  const raw = cookies().get('session')?.value
  if (!raw) return null
  const i = raw.lastIndexOf('.')
  const value = raw.slice(0, i), mac = raw.slice(i + 1)
  const expected = sign(value)
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null
  if (value === 'teacher') return { role: 'teacher' }
  if (value.startsWith('student:')) return { role: 'student', id: value.slice(8) }
  return null
}
