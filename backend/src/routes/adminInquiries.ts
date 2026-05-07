import { Router } from 'express'
import type { Decimal } from '@prisma/client/runtime/library'
import { z } from 'zod'
import { requireAdminAuth } from '../middleware/adminAuth.js'
import { prisma } from '../lib/prisma.js'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  projectType: z
    .enum(['WEBSITE', 'MOBILE_APP', 'GAME', 'SERVICE_PROGRAM', 'OTHER'])
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
    memo: z.string().trim().max(5000).nullable().optional(),
    estimatedPrice: z.union([z.number().nonnegative(), z.null()]).optional(),
    isRead: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    source: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.memo !== undefined ||
      value.estimatedPrice !== undefined ||
      value.isRead !== undefined ||
      value.tags !== undefined ||
      value.source !== undefined,
    {
      message: '수정할 항목이 없습니다.',
    },
  )

function serializePrice(value: Decimal | null): number | null {
  if (value === null) {
    return null
  }
  return Number(value)
}

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
              { phone: { contains: keyword, mode: 'insensitive' as const } },
              { email: { contains: keyword, mode: 'insensitive' as const } },
              { companyName: { contains: keyword, mode: 'insensitive' as const } },
              { inquiryDetails: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [total, rows] = await Promise.all([
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
          phone: true,
          email: true,
          projectType: true,
          status: true,
          memo: true,
          expectedTimeline: true,
          budget: true,
          estimatedPrice: true,
          isRead: true,
          source: true,
          tags: true,
          customerIp: true,
          createdAt: true,
        },
      }),
    ])

    const items = rows.map((row) => ({
      ...row,
      estimatedPrice: serializePrice(row.estimatedPrice),
    }))

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
      include: { attachments: true },
    })

    if (!inquiry) {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' })
    }

    return res.status(200).json({
      ...inquiry,
      estimatedPrice: serializePrice(inquiry.estimatedPrice),
    })
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

    const { status, memo, estimatedPrice, isRead, tags, source } = parsedBody.data
    const memoValue = memo === undefined ? undefined : memo || null
    const sourceValue = source === undefined ? undefined : source || null

    const inquiry = await prisma.inquiry.update({
      where: { id: parsedParams.data.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(memoValue !== undefined ? { memo: memoValue } : {}),
        ...(estimatedPrice !== undefined ? { estimatedPrice } : {}),
        ...(isRead !== undefined ? { isRead } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(sourceValue !== undefined ? { source: sourceValue } : {}),
      },
      include: { attachments: true },
    })

    return res.status(200).json({
      ...inquiry,
      estimatedPrice: serializePrice(inquiry.estimatedPrice),
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: '문의를 찾을 수 없습니다.' })
    }
    console.error(error)
    return res.status(500).json({ message: '문의 관리 정보 저장 중 오류가 발생했습니다.' })
  }
})
