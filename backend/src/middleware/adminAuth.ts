import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'

type AdminJwtPayload = {
  sub: string
  email: string
  role: 'admin'
}

const getTokenFromHeader = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

export const requireAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization)
    if (!token) {
      return res.status(401).json({ message: '관리자 인증이 필요합니다.' })
    }

    const jwtSecret = process.env.ADMIN_JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({ message: '서버 인증 설정이 누락되었습니다.' })
    }

    const decoded = jwt.verify(token, jwtSecret) as AdminJwtPayload
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 없습니다.' })
    }

    const adminId = Number(decoded.sub)
    if (!Number.isInteger(adminId) || adminId <= 0) {
      return res.status(401).json({ message: '유효하지 않은 관리자 토큰입니다.' })
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true, isActive: true },
    })

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({ message: '비활성화된 관리자 계정입니다.' })
    }

    res.locals.adminUser = adminUser
    return next()
  } catch (_error) {
    return res.status(401).json({ message: '관리자 인증이 유효하지 않습니다.' })
  }
}
