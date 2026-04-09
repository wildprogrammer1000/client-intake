import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createInquirySchema = z.object({
  companyName: z.string().trim().max(200).optional(),
  name: z.string().trim().min(1).max(100),
  contact: z.string().trim().min(1).max(200),
  projectType: z.enum([
    'WEBSITE',
    'MOBILE_APP',
    'ADMIN_SYSTEM',
    'SHOPPING_MALL',
    'OTHER',
  ]),
  projectTypeDetail: z.string().trim().max(200).optional(),
  developmentPurpose: z.string().trim().min(1).max(2000),
  keyFeatures: z.string().trim().min(1).max(4000),
  referenceLinks: z.string().trim().max(2000).optional(),
  expectedTimeline: z.string().trim().min(1).max(1000),
  budget: z.string().trim().min(1).max(500),
  inquiryDetails: z.string().trim().min(1).max(8000),
  attachmentUrls: z.array(z.string().url()).max(10).optional().default([]),
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
        companyName: payload.companyName,
        name: payload.name,
        contact: payload.contact,
        projectType: payload.projectType,
        projectTypeDetail: payload.projectTypeDetail,
        developmentPurpose: payload.developmentPurpose,
        keyFeatures: payload.keyFeatures,
        referenceLinks: payload.referenceLinks,
        expectedTimeline: payload.expectedTimeline,
        budget: payload.budget,
        inquiryDetails: payload.inquiryDetails,
        attachmentUrls: payload.attachmentUrls,
      },
    })

    return res.status(201).json({
      id: inquiry.id,
      createdAt: inquiry.createdAt,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '문의 저장 중 오류가 발생했습니다.' })
  }
})
