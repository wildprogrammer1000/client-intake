import { Router } from 'express'
import { z } from 'zod'
import { sendInquiryNotificationEmail } from '../lib/inquiryNotification.js'
import { prisma } from '../lib/prisma.js'
import { getRequestClientIp } from '../lib/requestIp.js'

const emptyOrEmail = z.union([z.literal(''), z.string().email()])

const attachmentInputSchema = z.object({
  url: z.string().url(),
  fileName: z.string().trim().max(500).optional(),
})

const createInquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(40),
  email: emptyOrEmail.optional().default(''),
  projectType: z.enum(['WEBSITE', 'MOBILE_APP', 'GAME', 'SERVICE_PROGRAM', 'OTHER']),
  projectTypeDetail: z.string().trim().max(200).optional(),
  developmentPurpose: z.string().trim().min(1).max(2000),
  keyFeatures: z.string().trim().min(1).max(4000),
  referenceLinks: z.string().trim().max(2000).optional(),
  expectedTimeline: z.string().trim().min(1).max(1000),
  budget: z.string().trim().min(1).max(500),
  inquiryDetails: z.string().trim().min(1).max(8000),
  attachments: z.array(attachmentInputSchema).max(10).optional().default([]),
  source: z.string().trim().max(500).optional(),
})

export const inquiryRouter = Router()

inquiryRouter.post('/', async (req, res) => {
  try {
    const result = createInquirySchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        message: '요청 본문이 유효하지 않습니다.',
        issues: result.error.flatten(),
      })
    }

    const payload = result.data
    const inquiry = await prisma.inquiry.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        email: payload.email ?? '',
        projectType: payload.projectType,
        projectTypeDetail: payload.projectTypeDetail,
        developmentPurpose: payload.developmentPurpose,
        keyFeatures: payload.keyFeatures,
        referenceLinks: payload.referenceLinks,
        expectedTimeline: payload.expectedTimeline,
        budget: payload.budget,
        inquiryDetails: payload.inquiryDetails,
        customerIp: getRequestClientIp(req),
        source: payload.source?.length ? payload.source : null,
        attachments: {
          create: payload.attachments.map((a) => ({
            url: a.url,
            fileName: a.fileName ?? null,
          })),
        },
      },
      include: { attachments: true },
    })

    try {
      await sendInquiryNotificationEmail(inquiry)
    } catch (mailError) {
      console.error('[inquiryNotification] 문의 알림 메일 전송 실패', mailError)
    }

    return res.status(201).json({
      id: inquiry.id,
      createdAt: inquiry.createdAt,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '문의 저장 중 오류가 발생했습니다.' })
  }
})
