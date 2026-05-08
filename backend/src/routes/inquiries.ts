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

const inquiryKindSchema = z.enum(['NEW_DEVELOPMENT', 'FEATURE_MODIFICATION', 'ISSUE_RESOLUTION'])
type InquiryKind = z.infer<typeof inquiryKindSchema>

const createInquiryBaseSchema = z.object({
  inquiryKind: inquiryKindSchema,
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(40),
  email: emptyOrEmail.optional().default(''),
  projectType: z.enum(['WEBSITE', 'MOBILE_APP', 'GAME', 'SERVICE_PROGRAM', 'OTHER']),
  projectTypeDetail: z.string().trim().max(200).optional(),
  inquiryDetails: z.string().trim().min(1).max(8000),
  source: z.string().trim().max(500).optional(),
})

const newDevelopmentInquirySchema = createInquiryBaseSchema.extend({
  inquiryKind: z.literal('NEW_DEVELOPMENT'),
  developmentPurpose: z.string().trim().min(1).max(2000),
  keyFeatures: z.string().trim().min(1).max(4000),
  referenceLinks: z.string().trim().max(2000).optional(),
  expectedTimeline: z.string().trim().min(1).max(1000),
  budget: z.string().trim().min(1).max(500),
  attachments: z.array(attachmentInputSchema).max(5).optional().default([]),
})

const featureModificationInquirySchema = createInquiryBaseSchema.extend({
  inquiryKind: z.literal('FEATURE_MODIFICATION'),
  developmentPurpose: z.string().trim().min(1).max(2000),
  keyFeatures: z.string().trim().min(1).max(4000),
  referenceLinks: z.string().trim().max(2000).optional(),
  expectedTimeline: z.string().trim().min(1).max(1000),
  budget: z.string().trim().min(1).max(500),
  attachments: z.array(attachmentInputSchema).max(8).optional().default([]),
})

const issueResolutionInquirySchema = createInquiryBaseSchema.extend({
  inquiryKind: z.literal('ISSUE_RESOLUTION'),
  developmentPurpose: z.string().trim().min(1).max(2000),
  keyFeatures: z.string().trim().min(1).max(4000),
  referenceLinks: z.string().trim().max(2000).optional(),
  expectedTimeline: z.string().trim().min(1).max(1000),
  budget: z.string().trim().min(1).max(500),
  attachments: z.array(attachmentInputSchema).max(3).optional().default([]),
})

const createInquirySchema = z.discriminatedUnion('inquiryKind', [
  newDevelopmentInquirySchema,
  featureModificationInquirySchema,
  issueResolutionInquirySchema,
])

const allowedAttachmentExtensionsByKind: Record<InquiryKind, string[]> = {
  NEW_DEVELOPMENT: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'zip'],
  FEATURE_MODIFICATION: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'mov', 'zip'],
  ISSUE_RESOLUTION: ['txt', 'log', 'json', 'png', 'jpg', 'jpeg', 'webp'],
}

function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  if (idx < 0 || idx === fileName.length - 1) {
    return ''
  }
  return fileName.slice(idx + 1).toLowerCase()
}

function formatPhoneNumber(value: string): string {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 9 && digits.startsWith('02')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  }

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }

  return trimmed
}

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
    const formattedPhone = formatPhoneNumber(payload.phone)
    const allowedExtensions = allowedAttachmentExtensionsByKind[payload.inquiryKind]
    const invalidFile = payload.attachments.find((attachment) => {
      if (!attachment.fileName) {
        return false
      }
      const ext = getFileExtension(attachment.fileName)
      return !ext || !allowedExtensions.includes(ext)
    })
    if (invalidFile) {
      return res.status(400).json({
        message: '첨부파일 형식이 문의 유형 제한과 맞지 않습니다.',
      })
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryKind: payload.inquiryKind,
        name: payload.name,
        phone: formattedPhone,
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
