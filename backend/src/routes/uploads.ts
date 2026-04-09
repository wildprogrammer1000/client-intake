import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'

const createPresignedUrlSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(100),
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
      return res.status(500).json({
        message:
          'S3 업로드 설정이 누락되었습니다. AWS_REGION, AWS_S3_BUCKET을 확인해주세요.',
      })
    }

    const prefix = process.env.AWS_S3_PREFIX?.trim() || 'inquiries'
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const { fileName, contentType } = parsed.data
    const safeFileName = buildSafeFileName(fileName)
    const key = `${prefix}/${year}/${month}/${randomUUID()}-${safeFileName}`

    const s3Client = new S3Client({ region })
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: uploadUrlExpireSeconds,
    })
    const fileUrl = buildFileUrl(bucket, region, key)

    return res.status(200).json({
      key,
      uploadUrl,
      fileUrl,
      expiresIn: uploadUrlExpireSeconds,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '업로드 URL 생성 중 오류가 발생했습니다.' })
  }
})
