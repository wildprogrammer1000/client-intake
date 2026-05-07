import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import type { Inquiry, InquiryAttachment, ProjectType } from '../generated/prisma/index.js'

export type InquiryWithAttachments = Inquiry & { attachments: InquiryAttachment[] }

const projectTypeLabelMap: Record<ProjectType, string> = {
  WEBSITE: '웹사이트',
  MOBILE_APP: '모바일 앱',
  GAME: '게임',
  SERVICE_PROGRAM: '서비스 프로그램',
  OTHER: '기타',
}

let sesClient: SESClient | null = null

const getSesClient = () => {
  if (sesClient) {
    return sesClient
  }

  sesClient = new SESClient({
    region: process.env.AWS_REGION,
  })

  return sesClient
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Seoul',
  }).format(date)
}

export const sendInquiryNotificationEmail = async (payload: InquiryWithAttachments) => {
  const fromAddress = process.env.AWS_SES_FROM_EMAIL
  const toAddress = process.env.ADMIN_NOTIFICATION_EMAIL

  if (!fromAddress || !toAddress) {
    console.warn(
      '[inquiryNotification] AWS_SES_FROM_EMAIL 또는 ADMIN_NOTIFICATION_EMAIL이 설정되지 않아 메일 전송을 건너뜁니다.',
    )
    return
  }

  const projectTypeLabel = projectTypeLabelMap[payload.projectType]
  const attachmentText =
    payload.attachments.length > 0
      ? payload.attachments.map((a) => a.url).join('\n')
      : '첨부 파일 없음'
  const referenceLinks = payload.referenceLinks ?? '-'
  const projectTypeDetail = payload.projectTypeDetail ?? '-'
  const createdAt = formatDateTime(payload.createdAt)
  const subject = `[문의 접수] ${payload.name} (${projectTypeLabel})`
  const emailLine = payload.email?.trim() ? payload.email.trim() : '(미입력)'

  const textBody = [
    '새 문의가 접수되었습니다.',
    '',
    `문의 ID: ${payload.id}`,
    `접수 시각: ${createdAt}`,
    `이름: ${payload.name}`,
    `전화: ${payload.phone}`,
    `이메일: ${emailLine}`,
    `프로젝트 유형: ${projectTypeLabel}`,
    `프로젝트 유형 상세: ${projectTypeDetail}`,
    `개발 목적: ${payload.developmentPurpose}`,
    `핵심 기능: ${payload.keyFeatures}`,
    `참고 링크: ${referenceLinks}`,
    `예상 일정: ${payload.expectedTimeline}`,
    `예산: ${payload.budget}`,
    `문의 내용: ${payload.inquiryDetails}`,
    `첨부 파일 URL:\n${attachmentText}`,
  ].join('\n')

  const htmlBody = `
    <h2>새 문의가 접수되었습니다.</h2>
    <ul>
      <li><strong>문의 ID:</strong> ${payload.id}</li>
      <li><strong>접수 시각:</strong> ${escapeHtml(createdAt)}</li>
      <li><strong>이름:</strong> ${escapeHtml(payload.name)}</li>
      <li><strong>전화:</strong> ${escapeHtml(payload.phone)}</li>
      <li><strong>이메일:</strong> ${escapeHtml(emailLine)}</li>
      <li><strong>프로젝트 유형:</strong> ${escapeHtml(projectTypeLabel)}</li>
      <li><strong>프로젝트 유형 상세:</strong> ${escapeHtml(projectTypeDetail)}</li>
      <li><strong>개발 목적:</strong> ${escapeHtml(payload.developmentPurpose)}</li>
      <li><strong>핵심 기능:</strong> ${escapeHtml(payload.keyFeatures)}</li>
      <li><strong>참고 링크:</strong> ${escapeHtml(referenceLinks)}</li>
      <li><strong>예상 일정:</strong> ${escapeHtml(payload.expectedTimeline)}</li>
      <li><strong>예산:</strong> ${escapeHtml(payload.budget)}</li>
      <li><strong>문의 내용:</strong> ${escapeHtml(payload.inquiryDetails)}</li>
      <li><strong>첨부 파일 URL:</strong><br/>${attachmentText
        .split('\n')
        .map((url) => escapeHtml(url))
        .join('<br/>')}</li>
    </ul>
  `

  await getSesClient().send(
    new SendEmailCommand({
      Source: fromAddress,
      Destination: {
        ToAddresses: [toAddress],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    }),
  )
}
