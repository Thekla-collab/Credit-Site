# Klassenkonto – Klasse 8b

Gemeinsames Credit-Konto: Der Lehrer vergibt Credits, die Klasse kauft davon Belohnungen –
aber nur, wenn alle 28 Schüler zugestimmt haben.

## Starten
1. `npm install`
2. `npx prisma db push`
3. `npx prisma db seed`
4. `npm run dev` → http://localhost:3000

## Zugangsdaten
- Lehrer: Passwort aus `.env` (`TEACHER_PASSWORD`, Standard `lehrer8b`)
- Schüler: Name wählen + PIN (1001 bis 1028, alphabetisch). Die PIN-Liste sieht der Lehrer in der App.
- Vor dem echten Einsatz `TEACHER_PASSWORD` und `SESSION_SECRET` in `.env` ändern.
