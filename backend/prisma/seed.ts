import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

const run = async () => {
  const initialUserId = process.env.ADMIN_INITIAL_USER_ID?.trim() ?? 'admin'
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim() ?? 'ChangeMe123!'
  const initialName = process.env.ADMIN_INITIAL_NAME?.trim() ?? 'Master Admin'

  const passwordHash = await bcrypt.hash(initialPassword, 12)

  const existingByUserId = await prisma.adminUser.findUnique({
    where: { userId: initialUserId },
  })

  const admin = existingByUserId
    ? await prisma.adminUser.update({
        where: { id: existingByUserId.id },
        data: {
          userId: initialUserId,
          name: initialName,
          passwordHash,
          isActive: true,
        },
      })
    : await prisma.adminUser.create({
        data: {
          userId: initialUserId,
          name: initialName,
          passwordHash,
          isActive: true,
        },
      })

  console.log(`Initial admin ensured: ${admin.userId}`)
}

run()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
