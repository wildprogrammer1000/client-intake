import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { buildAwsClientConfig } from '../lib/awsClientConfig.js'

const createPresignedUrlSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(100),
  fileSize: z.number().int().positive(),
  inquiryKind: z.enum(['NEW_DEVELOPMENT', 'FEATURE_MODIFICATION', 'ISSUE_RESOLUTION']),
})

const buildSafeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

const buildFileUrl = (bucket: string, region: string, key: string): string => {
  const cloudfrontBaseUrl = process.env.AWS_CLOUDFRONT_URL?.trim()
  if (cloudfrontBaseUrl) {
    const normalizedBaseUrl = cloudfrontBaseUrl.replace(/\/+$/, '')
    return `${normalizedBaseUrl}/${key}`
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

const uploadUrlExpireSeconds = 300
const mb = 1024 * 1024
const imageAndPdfMaxFileSize = 20 * mb
const videoMaxFileSize = 200 * mb
const zipMaxFileSize = 200 * mb
const allowedImageAndPdfTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'] as const
const allowedZipTypes = ['application/zip', 'application/x-zip-compressed'] as const

const allowedTypesByInquiryKind: Record<
  'NEW_DEVELOPMENT' | 'FEATURE_MODIFICATION' | 'ISSUE_RESOLUTION',
  readonly string[]
> = {
  NEW_DEVELOPMENT: [...allowedImageAndPdfTypes, ...allowedZipTypes],
  FEATURE_MODIFICATION: [...allowedImageAndPdfTypes, ...allowedZipTypes],
  ISSUE_RESOLUTION: [...allowedImageAndPdfTypes, ...allowedVideoTypes, ...allowedZipTypes],
}

const getTypeGroup = (contentType: string): 'image-pdf' | 'video' | 'zip' | 'other' => {
  if (allowedImageAndPdfTypes.includes(contentType as (typeof allowedImageAndPdfTypes)[number])) {
    return 'image-pdf'
  }
  if (allowedVideoTypes.includes(contentType as (typeof allowedVideoTypes)[number])) {
    return 'video'
  }
  if (allowedZipTypes.includes(contentType as (typeof allowedZipTypes)[number])) {
    return 'zip'
  }
  return 'other'
}

const getMaxFileSize = (contentType: string): number => {
  const typeGroup = getTypeGroup(contentType)
  if (typeGroup === 'video') {
    return videoMaxFileSize
  }
  if (typeGroup === 'zip') {
    return zipMaxFileSize
  }
  return imageAndPdfMaxFileSize
}

export const uploadRouter = Router()

uploadRouter.post('/presigned-url', async (req, res) => {
  try {
    const parsed = createPresignedUrlSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: '업로드 URL 요청 값이 유효하지 않습니다.',
        issues: parsed.error.flatten(),
      })
    }

    const region = process.env.AWS_REGION?.trim()
    const bucket = process.env.AWS_S3_BUCKET?.trim()

    if (!region || !bucket) {
      console.error('[uploads] missing required S3 env', {
        hasRegion: Boolean(region),
        hasBucket: Boolean(bucket),
      })
      return res.status(500).json({
        message:
          'S3 업로드 설정이 누락되었습니다. AWS_REGION, AWS_S3_BUCKET을 확인해주세요.',
      })
    }

    const prefix = process.env.AWS_S3_PREFIX?.trim() || 'inquiries'
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const { fileName, contentType, fileSize, inquiryKind } = parsed.data
    const normalizedContentType = contentType.toLowerCase()
    const allowedTypes = allowedTypesByInquiryKind[inquiryKind]

    if (!allowedTypes.includes(normalizedContentType)) {
      return res.status(400).json({
        message:
          inquiryKind === 'ISSUE_RESOLUTION'
            ? '허용되지 않는 파일 형식입니다. 이미지(jpg/png/webp), PDF, ZIP, 영상(mp4/mov/webm)만 업로드할 수 있습니다. 지원하지 않는 형식은 ZIP으로 압축해서 첨부해주세요.'
            : '허용되지 않는 파일 형식입니다. 이미지(jpg/png/webp), PDF, ZIP만 업로드할 수 있습니다. 지원하지 않는 형식은 ZIP으로 압축해서 첨부해주세요.',
      })
    }

    const maxFileSize = getMaxFileSize(normalizedContentType)
    if (fileSize > maxFileSize) {
      const maxSizeMb = Math.floor(maxFileSize / mb)
      return res.status(400).json({
        message:
          getTypeGroup(normalizedContentType) === 'video'
            ? `영상 파일은 ${maxSizeMb}MB 이하만 업로드할 수 있습니다.`
            : getTypeGroup(normalizedContentType) === 'zip'
              ? `ZIP 파일은 ${maxSizeMb}MB 이하만 업로드할 수 있습니다.`
            : `이미지/PDF 파일은 ${maxSizeMb}MB 이하만 업로드할 수 있습니다.`,
      })
    }

    const safeFileName = buildSafeFileName(fileName)
    const key = `${prefix}/${year}/${month}/${randomUUID()}-${safeFileName}`

    const s3Client = new S3Client(buildAwsClientConfig(region))
    const presignedPost = await createPresignedPost(s3Client, {
      Bucket: bucket,
      Key: key,
      Expires: uploadUrlExpireSeconds,
      Conditions: [
        ['content-length-range', 1, maxFileSize],
      ],
    })
    const fileUrl = buildFileUrl(bucket, region, key)

    return res.status(200).json({
      key,
      uploadUrl: presignedPost.url,
      uploadFields: presignedPost.fields,
      fileUrl,
      expiresIn: uploadUrlExpireSeconds,
    })
  } catch (error) {
    console.error('[uploads] failed to create presigned url', {
      hasRegion: Boolean(process.env.AWS_REGION?.trim()),
      hasBucket: Boolean(process.env.AWS_S3_BUCKET?.trim()),
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    return res.status(500).json({ message: '업로드 URL 생성 중 오류가 발생했습니다.' })
  }
})
