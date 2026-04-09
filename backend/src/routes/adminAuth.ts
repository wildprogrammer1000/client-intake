import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Router } from 'express'
import { z } from 'zod'
import { requireAdminAuth } from '../middleware/adminAuth.js'
import { prisma } from '../lib/prisma.js'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const adminAuthRouter = Router()

adminAuthRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: '로그인 요청 값이 유효하지 않습니다.',
        issues: parsed.error.flatten(),
      })
    }

    const { email, password } = parsed.data
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    const isMatch = await bcrypt.compare(password, adminUser.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    const jwtSecret = process.env.ADMIN_JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({ message: '서버 인증 설정이 누락되었습니다.' })
    }

    const token = jwt.sign(
      {
        sub: String(adminUser.id),
        email: adminUser.email,
        role: 'admin',
      },
      jwtSecret,
      { expiresIn: '12h' },
    )

    return res.status(200).json({
      token,
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '관리자 로그인 중 오류가 발생했습니다.' })
  }
})

adminAuthRouter.get('/me', requireAdminAuth, async (_req, res) => {
  return res.status(200).json({ adminUser: res.locals.adminUser })
})
