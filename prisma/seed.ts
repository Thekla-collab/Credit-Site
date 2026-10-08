import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const STUDENTS_8B = [
  "Anna", "Aurelia", "Carolin", "Clemens", "Ella", "Filip", "Flynn", "Jannis",
  "Laura", "Leni", "Lennart", "Lenya", "Linda", "Linnea", "Linni", "Luci",
  "Maja", "Martin", "Mayla", "Moses", "Nahla", "Nele", "Ole", "Paul",
  "Scarlett", "Sofia", "Tamme", "Marlon"
]
const SHOP_ITEMS = [
  { title: "Keine Hausaufgaben", price: 75, icon: "📝" },
  { title: "Gummibärchen", price: 100, icon: "🍬" },
  { title: "Eis für die Klasse", price: 250, icon: "🍦" },
  { title: "Filmstunde", price: 400, icon: "🎬" }
]
async function main() {
  await prisma.classAccount.upsert({ where: { id: 1 }, update: {}, create: { id: 1, balance: 350 } })
  if ((await prisma.transaction.count()) === 0) {
    await prisma.transaction.create({ data: { amount: 350, reason: "Startguthaben Klasse 8b" } })
  }
  for (const item of SHOP_ITEMS) {
    const existing = await prisma.shopItem.findFirst({ where: { title: item.title } })
    if (!existing) await prisma.shopItem.create({ data: item })
  }
  for (let i = 0; i < STUDENTS_8B.length; i++) {
    const name = STUDENTS_8B[i]
    await prisma.student.upsert({ where: { name }, update: {}, create: { name, pin: (1001 + i).toString() } })
  }
  console.log("Seed fertig: 28 Schüler, 4 Artikel.")
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
