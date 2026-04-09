import { Router } from 'express'
import { z } from 'zod'
import { requireAdminAuth } from '../middleware/adminAuth.js'
import { prisma } from '../lib/prisma.js'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  projectType: z
    .enum(['WEBSITE', 'MOBILE_APP', 'ADMIN_SYSTEM', 'SHOPPING_MALL', 'OTHER'])
    .optional(),
  keyword: z.string().trim().max(200).optional(),
})

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const adminInquiryRouter = Router()
adminInquiryRouter.use(requireAdminAuth)

adminInquiryRouter.get('/', async (req, res) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({
        message: '조회 파라미터가 유효하지 않습니다.',
        issues: parsed.error.flatten(),
      })
    }

    const { page, pageSize, projectType, keyword } = parsed.data
    const skip = (page - 1) * pageSize

    const where = {
      ...(projectType ? { projectType } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' as const } },
              { contact: { contains: keyword, mode: 'insensitive' as const } },
              { companyName: { contains: keyword, mode: 'insensitive' as const } },
              { inquiryDetails: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [total, items] = await Promise.all([
      prisma.inquiry.count({ where }),
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          companyName: true,
          name: true,
          contact: true,
          projectType: true,
          expectedTimeline: true,
          budget: true,
          createdAt: true,
        },
      }),
    ])

    return res.status(200).json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '문의 목록 조회 중 오류가 발생했습니다.' })
  }
})

adminInquiryRouter.get('/:id', async (req, res) => {
  try {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) {
      return res.status(400).json({
        message: '문의 ID가 유효하지 않습니다.',
        issues: parsed.error.flatten(),
      })
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: parsed.data.id },
    })

    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' })
    }

    return res.status(200).json(inquiry)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '문의 상세 조회 중 오류가 발생했습니다.' })
  }
})
