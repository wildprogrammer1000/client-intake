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
import { SERVICE_INQUIRY_FORM_COPY } from '../../inquiry/serviceInquiryFormCopy'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

type ProjectType = 'WEBSITE' | 'MOBILE_APP' | 'GAME' | 'SERVICE_PROGRAM' | 'OTHER'

export type ServiceInquiryFormState = {
  name: string
  contact: string
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
  contact: '',
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
  const copy = SERVICE_INQUIRY_FORM_COPY[kind]
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
    return Boolean(
      form.name.trim() &&
        form.contact.trim() &&
        form.developmentPurpose.trim() &&
        form.keyFeatures.trim() &&
        form.expectedTimeline.trim() &&
        form.budget.trim() &&
        form.inquiryDetails.trim(),
    )
  }, [form])

  const handleTextChange =
    (field: keyof ServiceInquiryFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []))
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (!files.length) {
      return []
    }

    const uploadedUrls: string[] = []

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

      uploadedUrls.push(presignedData.fileUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const attachmentUrls = await uploadFiles()
      const kindLabel = INQUIRY_KIND_LABEL[kind]
      const inquiryDetailsForApi = `〔문의 유형: ${kindLabel}〕\n\n${form.inquiryDetails.trim()}`

      const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          contact: form.contact.trim(),
          projectType: form.projectType,
          projectTypeDetail: form.projectTypeDetail.trim() || undefined,
          developmentPurpose: form.developmentPurpose.trim(),
          keyFeatures: form.keyFeatures.trim(),
          referenceLinks: form.referenceLinks.trim() || undefined,
          expectedTimeline: form.expectedTimeline.trim(),
          budget: form.budget.trim(),
          inquiryDetails: inquiryDetailsForApi,
          attachmentUrls,
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

  const ph = copy.placeholders

  return (
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Typography variant="h6">{copy.sectionBasic}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              required
              label={copy.labels.name}
              placeholder={ph.name}
              value={form.name}
              onChange={handleTextChange('name')}
            />
            <TextField
              fullWidth
              required
              label={copy.labels.contact}
              placeholder={ph.contact}
              value={form.contact}
              onChange={handleTextChange('contact')}
            />
          </Stack>

          <Typography variant="h6">{copy.sectionProject}</Typography>
          <FormControl fullWidth required>
            <InputLabel id={`project-type-label-${kind}`}>{copy.labels.projectType}</InputLabel>
            <Select
              labelId={`project-type-label-${kind}`}
              label={copy.labels.projectType}
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
              label={copy.labels.projectTypeDetail}
              placeholder={ph.projectTypeDetail}
              value={form.projectTypeDetail}
              onChange={handleTextChange('projectTypeDetail')}
            />
          ) : null}

          <TextField
            fullWidth
            required
            multiline
            minRows={2}
            label={copy.labels.developmentPurpose}
            placeholder={ph.developmentPurpose}
            value={form.developmentPurpose}
            onChange={handleTextChange('developmentPurpose')}
          />
          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label={copy.labels.keyFeatures}
            placeholder={ph.keyFeatures}
            value={form.keyFeatures}
            onChange={handleTextChange('keyFeatures')}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={copy.labels.referenceLinks}
            placeholder={ph.referenceLinks}
            value={form.referenceLinks}
            onChange={handleTextChange('referenceLinks')}
          />

          <Typography variant="h6">{copy.sectionSchedule}</Typography>
          <TextField
            fullWidth
            required
            multiline
            minRows={2}
            label={copy.labels.expectedTimeline}
            placeholder={ph.expectedTimeline}
            value={form.expectedTimeline}
            onChange={handleTextChange('expectedTimeline')}
          />
          <TextField
            fullWidth
            required
            label={copy.labels.budget}
            placeholder={ph.budget}
            value={form.budget}
            onChange={handleTextChange('budget')}
          />

          <Typography variant="h6">{copy.sectionDetail}</Typography>
          <TextField
            fullWidth
            required
            multiline
            minRows={5}
            label={copy.labels.inquiryDetails}
            placeholder={ph.inquiryDetails}
            value={form.inquiryDetails}
            onChange={handleTextChange('inquiryDetails')}
          />

          <Typography variant="h6">{copy.sectionFiles}</Typography>
          <TextField
            fullWidth
            type="file"
            slotProps={{ htmlInput: { multiple: true } }}
            onChange={handleFileChange}
            helperText={copy.fileHelper}
          />
          {files.length ? (
            <Alert severity="info">
              선택된 파일: {files.map((file) => file.name).join(', ')}
            </Alert>
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
