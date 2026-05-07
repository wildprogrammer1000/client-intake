import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { INQUIRY_KIND_LABEL, type InquiryServiceKind } from '../../inquiry/inquiryPaths'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

type ProjectType = 'WEBSITE' | 'MOBILE_APP' | 'GAME' | 'SERVICE_PROGRAM' | 'OTHER'

export type ServiceInquiryFormState = {
  name: string
  phone: string
  email: string
  projectType: ProjectType
  projectTypeDetail: string
  developmentPurpose: string
  keyFeatures: string
  referenceLinks: string
  expectedTimeline: string
  budget: string
  inquiryDetails: string
}

const initialFormValue: ServiceInquiryFormState = {
  name: '',
  phone: '',
  email: '',
  projectType: 'WEBSITE',
  projectTypeDetail: '',
  developmentPurpose: '',
  keyFeatures: '',
  referenceLinks: '',
  expectedTimeline: '',
  budget: '',
  inquiryDetails: '',
}

type ServiceInquiryFormProps = {
  kind: InquiryServiceKind
}

export default function ServiceInquiryForm({ kind }: ServiceInquiryFormProps) {
  const inquiryKindForApi =
    kind === 'new-service'
      ? 'NEW_DEVELOPMENT'
      : kind === 'feature-extension'
        ? 'FEATURE_MODIFICATION'
        : 'ISSUE_RESOLUTION'
  const maxFilesByKind = {
    'new-service': 5,
    'feature-extension': 8,
    'issue-resolution': 3,
  } as const
  const [form, setForm] = useState<ServiceInquiryFormState>(initialFormValue)
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const canSubmit = useMemo(() => {
    const hasBasicFields = Boolean(form.name.trim() && form.phone.trim())

    if (!hasBasicFields) {
      return false
    }

    if (kind === 'new-service') {
      return Boolean(
        form.developmentPurpose.trim() &&
          form.keyFeatures.trim() &&
          form.expectedTimeline.trim() &&
          form.budget.trim() &&
          form.inquiryDetails.trim(),
      )
    }

    if (kind === 'feature-extension') {
      return Boolean(form.inquiryDetails.trim())
    }

    return Boolean(
      form.inquiryDetails.trim() &&
        form.expectedTimeline.trim(),
    )
  }, [form, kind])

  const handleTextChange =
    (field: keyof ServiceInquiryFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    const maxFiles = maxFilesByKind[kind]

    if (selectedFiles.length > maxFiles) {
      setFiles(selectedFiles.slice(0, maxFiles))
      setToast({
        open: true,
        message: `첨부파일은 최대 ${maxFiles}개까지 업로드할 수 있습니다.`,
        severity: 'error',
      })
      return
    }

    setFiles(selectedFiles)
  }

  const uploadFiles = async (): Promise<{ url: string; fileName: string }[]> => {
    if (!files.length) {
      return []
    }

    const uploaded: { url: string; fileName: string }[] = []

    for (const file of files) {
      const presignedResponse = await fetch(`${API_BASE_URL}/api/uploads/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
        }),
      })

      if (!presignedResponse.ok) {
        throw new Error('첨부파일 업로드 URL 발급에 실패했습니다.')
      }

      const presignedData = (await presignedResponse.json()) as {
        uploadUrl: string
        fileUrl: string
      }

      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('첨부파일 업로드에 실패했습니다.')
      }

      uploaded.push({ url: presignedData.fileUrl, fileName: file.name })
    }

    return uploaded
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const attachments = await uploadFiles()
      const kindLabel = INQUIRY_KIND_LABEL[kind]
      const inquiryDetailsForApi = `〔문의 유형: ${kindLabel}〕\n\n${form.inquiryDetails.trim()}`
      const source =
        typeof document !== 'undefined' && document.referrer
          ? document.referrer.slice(0, 500)
          : undefined

      const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inquiryKind: inquiryKindForApi,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          projectType: form.projectType,
          projectTypeDetail: form.projectTypeDetail.trim() || undefined,
          developmentPurpose:
            kind === 'new-service'
              ? form.developmentPurpose.trim()
              : form.inquiryDetails.trim(),
          keyFeatures:
            kind === 'new-service'
              ? form.keyFeatures.trim()
              : form.inquiryDetails.trim(),
          referenceLinks:
            kind === 'new-service' ? form.referenceLinks.trim() || undefined : undefined,
          expectedTimeline:
            kind === 'new-service' || kind === 'issue-resolution'
              ? form.expectedTimeline.trim()
              : '협의 필요',
          budget: kind === 'new-service' ? form.budget.trim() : '미정',
          inquiryDetails:
            kind === 'new-service'
              ? inquiryDetailsForApi
              : `${inquiryDetailsForApi}\n\n${form.inquiryDetails.trim()}`,
          attachments,
          ...(source ? { source } : {}),
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(errorPayload?.message ?? '문의 접수에 실패했습니다.')
      }

      setForm(initialFormValue)
      setFiles([])
      setToast({
        open: true,
        message: '문의가 정상 접수되었습니다. 빠르게 확인 후 연락드리겠습니다.',
        severity: 'success',
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '문의 접수 중 알 수 없는 오류가 발생했습니다.'
      setToast({
        open: true,
        message,
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isNewService = kind === 'new-service'
  const isFeatureExtension = kind === 'feature-extension'
  const isIssueResolution = kind === 'issue-resolution'
  const projectTypeLabel = isNewService ? '만들고 싶은 서비스 유형' : '운영중인 서비스 유형'
  const detailLabel = isNewService ? '추가 정보' : isFeatureExtension ? '원하는 추가/수정 내용' : '오류 증상/내용'

  return (
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Typography variant="h6">기본 정보</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              required
              label="이름"
              placeholder="홍길동"
              value={form.name}
              onChange={handleTextChange('name')}
            />
            <TextField
              fullWidth
              required
              label="전화번호"
              placeholder="010-1234-5678"
              value={form.phone}
              onChange={handleTextChange('phone')}
            />
            <TextField
              fullWidth
              type="email"
              label="이메일"
              placeholder="name@example.com (선택)"
              value={form.email}
              onChange={handleTextChange('email')}
            />
          </Stack>

          <Typography variant="h6">신청 정보</Typography>
          <FormControl fullWidth required>
            <InputLabel id={`project-type-label-${kind}`}>{projectTypeLabel}</InputLabel>
            <Select
              labelId={`project-type-label-${kind}`}
              label={projectTypeLabel}
              value={form.projectType}
              onChange={(event) => {
                setForm((prev) => ({
                  ...prev,
                  projectType: event.target.value as ProjectType,
                }))
              }}
            >
              <MenuItem value="WEBSITE">웹사이트</MenuItem>
              <MenuItem value="MOBILE_APP">모바일 앱 (iOS / Android)</MenuItem>
              <MenuItem value="GAME">게임</MenuItem>
              <MenuItem value="SERVICE_PROGRAM">서비스 프로그램</MenuItem>
              <MenuItem value="OTHER">기타</MenuItem>
            </Select>
          </FormControl>

          {form.projectType === 'OTHER' ? (
            <TextField
              fullWidth
              label="서비스 유형 상세"
              placeholder="예: B2B 예약/정산 웹 서비스"
              value={form.projectTypeDetail}
              onChange={handleTextChange('projectTypeDetail')}
            />
          ) : null}

          {isNewService ? (
            <>
              <TextField
                fullWidth
                required
                multiline
                minRows={2}
                label="개발 목적"
                placeholder="예: 신규 창업 MVP를 출시하고 싶습니다."
                value={form.developmentPurpose}
                onChange={handleTextChange('developmentPurpose')}
              />
              <TextField
                fullWidth
                required
                multiline
                minRows={3}
                label="필요한 기능"
                placeholder="예: 회원가입/로그인, 예약/결제, 관리자 페이지"
                value={form.keyFeatures}
                onChange={handleTextChange('keyFeatures')}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="참고 서비스"
                placeholder="예: https://example.com"
                value={form.referenceLinks}
                onChange={handleTextChange('referenceLinks')}
              />
              <TextField
                fullWidth
                required
                multiline
                minRows={2}
                label="희망 일정"
                placeholder="예: 2개월 내 첫 버전 오픈"
                value={form.expectedTimeline}
                onChange={handleTextChange('expectedTimeline')}
              />
              <TextField
                fullWidth
                required
                label="예산"
                placeholder="예: 500만 ~ 1,000만원"
                value={form.budget}
                onChange={handleTextChange('budget')}
              />
            </>
          ) : null}

          {isIssueResolution ? (
            <TextField
              fullWidth
              required
              multiline
              minRows={2}
              label="희망 일정"
              placeholder="예: 영업일 기준 3일 내 원인 파악"
              value={form.expectedTimeline}
              onChange={handleTextChange('expectedTimeline')}
            />
          ) : null}

          <TextField
            fullWidth
            required
            multiline
            minRows={5}
            label={detailLabel}
            placeholder={
              isNewService
                ? '추가로 전달하고 싶은 정보가 있다면 자유롭게 작성해 주세요.'
                : isFeatureExtension
                  ? '운영 중인 서비스에서 어떤 기능을 어떻게 추가/수정하고 싶은지 작성해 주세요.'
                  : '발생한 오류 증상, 발생 시점, 재현 방법 등을 작성해 주세요.'
            }
            value={form.inquiryDetails}
            onChange={handleTextChange('inquiryDetails')}
          />

          {isNewService || isFeatureExtension ? (
            <>
              <Typography variant="h6">첨부 자료 (선택)</Typography>
              <TextField
                fullWidth
                type="file"
                slotProps={{ htmlInput: { multiple: true } }}
                onChange={handleFileChange}
                helperText={
                  isNewService
                    ? '기획서, 화면 설계서, 디자인 시안 등 (최대 5개)'
                    : '변경 요청서, 현재 화면 캡처, 관련 문서 등 (최대 8개)'
                }
              />
              {files.length ? (
                <Alert severity="info">
                  선택된 파일: {files.map((file) => file.name).join(', ')}
                </Alert>
              ) : null}
            </>
          ) : null}

          <Button type="submit" variant="contained" size="large" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? '문의 접수 중...' : '무료 견적 신청하기'}
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  )
}
