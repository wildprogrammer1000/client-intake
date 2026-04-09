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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: '새 비밀번호와 비밀번호 확인이 일치하지 않습니다.',
    path: ['confirmPassword'],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
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

adminAuthRouter.patch('/password', requireAdminAuth, async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: '비밀번호 변경 요청 값이 유효하지 않습니다.',
        issues: parsed.error.flatten(),
      })
    }

    const adminUserId = Number(res.locals.adminUser?.id)
    if (!adminUserId) {
      return res.status(401).json({ message: '관리자 인증 정보가 유효하지 않습니다.' })
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: { id: true, passwordHash: true, isActive: true },
    })

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({ message: '비활성화된 관리자 계정입니다.' })
    }

    const isCurrentPasswordMatch = await bcrypt.compare(
      parsed.data.currentPassword,
      adminUser.passwordHash,
    )
    if (!isCurrentPasswordMatch) {
      return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' })
    }

    const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.adminUser.update({
      where: { id: adminUserId },
      data: { passwordHash: newPasswordHash },
    })

    return res.status(200).json({ message: '비밀번호가 변경되었습니다.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다.' })
  }
})
