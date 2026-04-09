import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

const run = async () => {
  const initialEmail = (
    process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase() ?? 'admin@example.com'
  )
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim() ?? 'ChangeMe123!'
  const initialName = process.env.ADMIN_INITIAL_NAME?.trim() ?? 'Master Admin'

  const passwordHash = await bcrypt.hash(initialPassword, 12)

  const admin = await prisma.adminUser.upsert({
    where: { email: initialEmail },
    create: {
      email: initialEmail,
      name: initialName,
      passwordHash,
      isActive: true,
    },
    update: {
      name: initialName,
      passwordHash,
      isActive: true,
    },
  })

  console.log(`Initial admin ensured: ${admin.email}`)
}

run()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
