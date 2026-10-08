import './globals.css'
export const metadata = { title: 'Klassenkonto 8b', description: 'Gemeinsames Credit-Konto der Klasse 8b' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-stone-100 text-stone-900 antialiased">{children}</body>
    </html>
  )
}
