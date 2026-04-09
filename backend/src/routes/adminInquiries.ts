import { Router } from 'express'
import { z } from 'zod'
import { requireAdminAuth } from '../middleware/adminAuth.js'
import { prisma } from '../lib/prisma.js'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  projectType: z
    .enum(['WEBSITE', 'MOBILE_APP', 'ADMIN_SYSTEM', 'SHOPPING_MALL', 'GAME', 'OTHER'])
    .optional(),
  status: z.enum(['WAITING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  keyword: z.string().trim().max(200).optional(),
})

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const updateInquirySchema = z
  .object({
    status: z.enum(['WAITING', 'IN_PROGRESS', 'COMPLETED']).optional(),
    adminMemo: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.adminMemo !== undefined, {
    message: '수정할 항목이 없습니다.',
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

    const { page, pageSize, projectType, status, keyword } = parsed.data
    const skip = (page - 1) * pageSize

    const where = {
      ...(projectType ? { projectType } : {}),
      ...(status ? { status } : {}),
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
          status: true,
          adminMemo: true,
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

adminInquiryRouter.patch('/:id', async (req, res) => {
  try {
    const parsedParams = idParamSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return res.status(400).json({
        message: '문의 ID가 유효하지 않습니다.',
        issues: parsedParams.error.flatten(),
      })
    }

    const parsedBody = updateInquirySchema.safeParse(req.body)
    if (!parsedBody.success) {
      return res.status(400).json({
        message: '수정 요청 본문이 유효하지 않습니다.',
        issues: parsedBody.error.flatten(),
      })
    }

    const { status, adminMemo } = parsedBody.data
    const memoValue = adminMemo === undefined ? undefined : adminMemo || null

    const inquiry = await prisma.inquiry.update({
      where: { id: parsedParams.data.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(memoValue !== undefined ? { adminMemo: memoValue } : {}),
      },
    })

    return res.status(200).json(inquiry)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' })
    }
    console.error(error)
    return res.status(500).json({ message: '문의 관리 정보 저장 중 오류가 발생했습니다.' })
  }
})
