# Klassenkonto – Klasse 8b

Gemeinsames Credit-Konto: Der Lehrer vergibt Credits, die Klasse kauft davon Belohnungen,
aber nur, wenn alle 28 Schüler zugestimmt haben.

## Einrichtung (einmalig, auf deinem Computer)
1. Kostenlose Postgres-Datenbank anlegen (z. B. neon.tech) und die Verbindungs-URL kopieren.
2. `.env.example` nach `.env` kopieren und die Werte eintragen.
3. `npm install`
4. `npx prisma db push`   (legt die Tabellen an)
5. `npx prisma db seed`   (28 Schüler, 4 Artikel, 350 CR Startguthaben)
6. `npm run dev` -> http://localhost:3000

## Vercel
- package.json muss direkt im Hauptverzeichnis des Repositories liegen.
- Settings -> Environment Variables: DATABASE_URL, DIRECT_URL, TEACHER_PASSWORD, SESSION_SECRET
- Schritt 4 und 5 einmal lokal mit der Datenbank-URL ausführen, danach (neu) deployen.

## Zugangsdaten
- Lehrer: Passwort aus TEACHER_PASSWORD
- Schüler: Name wählen + PIN (1001 bis 1028, alphabetisch). Die PIN-Liste sieht der Lehrer in der App.
