'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  loginStudent, loginTeacher, logout, updateCredits,
  startPurchaseRequest, voteApproval, cancelPurchaseRequest,
} from './actions'

type Item = { id: string; title: string; price: number; icon: string }
type Props = {
  role: 'teacher' | 'student' | null
  meId: string | null
  meName: string | null
  balance: number
  students: { id: string; name: string }[]
  pins: { name: string; pin: string }[]
  shopItems: Item[]
  activeRequest: { id: string; item: Item; approvedIds: string[] } | null
  transactions: { id: string; amount: number; reason: string; createdAt: string }[]
}
type Msg = { ok: boolean; text: string } | null
type Run = (fn: () => Promise<{ success: boolean; message?: string }>, okText?: string) => Promise<void>

const card = 'rounded-xl border border-stone-300 bg-white p-5'
const btn = 'rounded-lg px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
const primary = `${btn} bg-emerald-800 text-white hover:bg-emerald-700`
const input = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700'

export default function AppInterface(p: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  // Live-Aktualisierung: alle 3 Sekunden neu laden
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(t)
  }, [router])

  const run: Run = async (fn, okText) => {
    setPending(true)
    try {
      const r = await fn()
      setMsg({ ok: r.success, text: r.success ? okText ?? 'Erledigt.' : r.message ?? 'Fehler.' })
    } catch {
      setMsg({ ok: false, text: 'Verbindungsfehler. Bitte noch einmal versuchen.' })
    }
    setPending(false)
    router.refresh()
  }

  const total = p.students.length
  const req = p.activeRequest
  const approved = req ? req.approvedIds.length : 0
  const missing = req ? p.students.filter(s => !req.approvedIds.includes(s.id)) : []
  const iVoted = !!req && !!p.meId && req.approvedIds.includes(p.meId)

  return (
    <main className="mx-auto max-w-3xl pb-16">
      <header className="bg-emerald-950 px-5 pb-8 pt-6 text-emerald-50 sm:rounded-b-3xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Klassenkonto 8b</h1>
          {p.role && (
            <div className="flex items-center gap-3 text-sm">
              <span>{p.role === 'teacher' ? 'Lehrer' : p.meName}</span>
              <button onClick={() => run(logout, 'Abgemeldet.')} className="rounded-md border border-emerald-300/40 px-3 py-1 hover:bg-emerald-900">
                Abmelden
              </button>
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-emerald-200">Gemeinsamer Kontostand</p>
        <p className="text-6xl font-bold tabular-nums sm:text-7xl">{p.balance} <span className="text-3xl font-medium text-emerald-300">CR</span></p>
      </header>

      <div className="space-y-6 px-4 pt-6">
        {msg && (
          <div role="status" className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
            {msg.text}
          </div>
        )}

        {!p.role && <Login students={p.students} run={run} pending={pending} />}

        {p.role && (
          <>
            {req ? (
              <section className={card}>
                <h2 className="text-lg font-semibold">Offener Kaufantrag: {req.item.icon} {req.item.title} ({req.item.price} CR)</h2>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Zusagen</span><span className="font-semibold tabular-nums">{approved} / {total}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full bg-emerald-700 transition-all" style={{ width: `${(approved / Math.max(total, 1)) * 100}%` }} />
                  </div>
                </div>
                {missing.length > 0 && (
                  <p className="mt-3 text-sm text-stone-600"><b>Es fehlen noch:</b> {missing.map(s => s.name).join(', ')}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  {p.role === 'student' && (
                    <button className={primary} disabled={pending || iVoted} onClick={() => run(() => voteApproval(req.id), 'Deine Zusage ist gespeichert.')}>
                      {iVoted ? 'Du hast zugestimmt' : 'Zustimmen'}
                    </button>
                  )}
                  {p.role === 'teacher' && (
                    <button className={`${btn} border border-red-300 text-red-800 hover:bg-red-50`} disabled={pending}
                      onClick={() => run(() => cancelPurchaseRequest(req.id), 'Antrag abgebrochen. Alle Zusagen sind zurückgesetzt.')}>
                      Antrag abbrechen
                    </button>
                  )}
                </div>
              </section>
            ) : (
              <p className="text-sm text-stone-600">Kein offener Kaufantrag. {p.role === 'student' ? 'Wähle unten einen Artikel, um einen zu starten.' : ''}</p>
            )}

            <section>
              <h2 className="mb-3 text-lg font-semibold">Shop</h2>
              <div className="grid grid-cols-2 gap-3">
                {p.shopItems.map(item => {
                  const tooExpensive = p.balance < item.price
                  const blocked = !!req || tooExpensive
                  return (
                    <div key={item.id} className={card}>
                      <div className="text-4xl">{item.icon}</div>
                      <div className="mt-2 font-semibold">{item.title}</div>
                      <div className="text-xl font-bold tabular-nums">{item.price} CR</div>
                      {p.role === 'student' && (
                        <>
                          <button className={`${primary} mt-3 w-full`} disabled={pending || blocked}
                            onClick={() => run(() => startPurchaseRequest(item.id), 'Kaufantrag gestartet. Jetzt brauchen alle Zusagen.')}>
                            Kauf vorschlagen
                          </button>
                          {(tooExpensive || req) && (
                            <p className="mt-2 text-xs text-stone-500">
                              {tooExpensive ? `Es fehlen ${item.price - p.balance} CR.` : 'Es läuft schon ein Antrag.'}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {p.role === 'teacher' && <TeacherPanel run={run} pending={pending} pins={p.pins} />}

            <section className={card}>
              <h2 className="mb-3 text-lg font-semibold">Verlauf</h2>
              <ul className="divide-y divide-stone-200 text-sm">
                {p.transactions.map(t => (
                  <li key={t.id} className="flex items-center justify-between py-2">
                    <span>{t.reason}<span className="ml-2 text-stone-400">{new Date(t.createdAt).toLocaleDateString('de-DE')}</span></span>
                    <span className={`font-semibold tabular-nums ${t.amount < 0 ? 'text-red-700' : 'text-emerald-800'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount} CR
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function Login({ students, run, pending }: { students: Props['students']; run: Run; pending: boolean }) {
  const [mode, setMode] = useState<'student' | 'teacher'>('student')
  const [studentId, setStudentId] = useState('')
  const [pin, setPin] = useState('')
  const [pw, setPw] = useState('')
  return (
    <section className={card}>
      <div className="mb-4 flex gap-2">
        {(['student', 'teacher'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`${btn} flex-1 ${mode === m ? 'bg-emerald-800 text-white' : 'border border-stone-300'}`}>
            {m === 'student' ? 'Schüler' : 'Lehrer'}
          </button>
        ))}
      </div>
      {mode === 'student' ? (
        <div className="space-y-3">
          <select className={input} value={studentId} onChange={e => setStudentId(e.target.value)} aria-label="Name">
            <option value="">Name auswählen</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className={input} inputMode="numeric" placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} />
          <button className={`${primary} w-full`} disabled={pending || !studentId || !pin} onClick={() => run(() => loginStudent(studentId, pin), 'Angemeldet.')}>
            Anmelden
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input className={input} type="password" placeholder="Lehrer-Passwort" value={pw} onChange={e => setPw(e.target.value)} />
          <button className={`${primary} w-full`} disabled={pending || !pw} onClick={() => run(() => loginTeacher(pw), 'Angemeldet.')}>
            Anmelden
          </button>
        </div>
      )}
    </section>
  )
}

function TeacherPanel({ run, pending, pins }: { run: Run; pending: boolean; pins: Props['pins'] }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  return (
    <section className={card}>
      <h2 className="mb-3 text-lg font-semibold">Credits verwalten</h2>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
        <input className={input} type="number" placeholder="Betrag" value={amount} onChange={e => setAmount(e.target.value)} />
        <input className={input} placeholder="Grund, z. B. Ruhige Woche" value={reason} onChange={e => setReason(e.target.value)} />
        <button className={primary} disabled={pending || !amount || !reason}
          onClick={() => { run(() => updateCredits(parseInt(amount, 10), reason), 'Credits gebucht.'); setAmount(''); setReason('') }}>
          Buchen
        </button>
      </div>
      <p className="mt-2 text-xs text-stone-500">Mit einem negativen Betrag korrigierst du den Stand nach unten.</p>
      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold">PIN-Liste der Schüler</summary>
        <ul className="mt-2 grid grid-cols-2 gap-x-6 text-sm sm:grid-cols-3">
          {pins.map(s => <li key={s.name} className="flex justify-between border-b border-stone-100 py-1"><span>{s.name}</span><span className="tabular-nums text-stone-500">{s.pin}</span></li>)}
        </ul>
      </details>
    </section>
  )
}
