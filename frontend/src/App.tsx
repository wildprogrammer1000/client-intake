import {
  Alert,
  Box,
  Button,
  Container,
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
import AdminPage from './AdminPage'

type ProjectType =
  | 'WEBSITE'
  | 'MOBILE_APP'
  | 'ADMIN_SYSTEM'
  | 'SHOPPING_MALL'
  | 'GAME'
  | 'OTHER'

type InquiryForm = {
  companyName: string
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const initialFormValue: InquiryForm = {
  companyName: '',
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

function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminPage />
  }

  const [form, setForm] = useState<InquiryForm>(initialFormValue)
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
      form.inquiryDetails.trim()
    )
  }, [form])

  const handleTextChange =
    (field: keyof InquiryForm) =>
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
      const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
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

  return (
    <Container maxWidth="md" sx={{ py: { xs: 5 } }}>
      <Stack spacing={2} sx={{ mb: 4, alignItems: 'center', textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          개발 문의하기
        </Typography>
        <Typography color="text.secondary">
          아래 신청서를 작성하고 무료로 견적을 받아보세요.
        </Typography>
      </Stack>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Typography variant="h6">1. 기본 정보</Typography>
          <TextField
            fullWidth
            label="회사명 (선택)"
            placeholder="ABC 스타트업 / 개인 프로젝트"
            value={form.companyName}
            onChange={handleTextChange('companyName')}
          />
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
              label="연락처"
              placeholder="010-1234-5678 / email@example.com"
              value={form.contact}
              onChange={handleTextChange('contact')}
            />
          </Stack>

          <Typography variant="h6">2. 프로젝트 정보</Typography>
          <FormControl fullWidth required>
            <InputLabel id="project-type-label">프로젝트 유형</InputLabel>
            <Select
              labelId="project-type-label"
              label="프로젝트 유형"
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
              <MenuItem value="ADMIN_SYSTEM">관리자 시스템</MenuItem>
              <MenuItem value="GAME">게임</MenuItem>
              <MenuItem value="OTHER">기타</MenuItem>
         
            </Select>
          </FormControl>

          {form.projectType === 'OTHER' ? (
            <TextField
              fullWidth
              label="프로젝트 유형 상세"
              placeholder="예: 웹 기반 예약 서비스"
              value={form.projectTypeDetail}
              onChange={handleTextChange('projectTypeDetail')}
            />
          ) : null}

          <TextField
            fullWidth
            required
            multiline
            minRows={2}
            label="개발 목적"
            placeholder={'신규 창업 서비스 MVP 개발\n기존 수기 예약 시스템을 자동화'}
            value={form.developmentPurpose}
            onChange={handleTextChange('developmentPurpose')}
          />
          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label="주요 기능"
            placeholder={
              '회원가입 / 로그인 (SNS 로그인 포함)\n예약 기능 (날짜/시간 선택)\n결제 기능 (카드 / 간편결제)\n관리자 페이지 (예약 관리)'
            }
            value={form.keyFeatures}
            onChange={handleTextChange('keyFeatures')}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="참고 서비스 / 레퍼런스 (선택)"
            placeholder={'야놀자 / 여기어때 같은 예약 UX\nhttps://example.com'}
            value={form.referenceLinks}
            onChange={handleTextChange('referenceLinks')}
          />

          <Typography variant="h6">3. 일정 & 예산</Typography>
          <TextField
            fullWidth
            required
            multiline
            minRows={2}
            label="예상 일정"
            placeholder={'2개월 내 출시 희망\nMVP 먼저 빠르게 개발 후 확장 예정'}
            value={form.expectedTimeline}
            onChange={handleTextChange('expectedTimeline')}
          />
          <TextField
            fullWidth
            required
            label="예산"
            placeholder="500만 ~ 1,000만원 / 협의 가능"
            value={form.budget}
            onChange={handleTextChange('budget')}
          />

          <Typography variant="h6">4. 상세 설명</Typography>
          <TextField
            fullWidth
            required
            multiline
            minRows={5}
            label="문의 내용"
            placeholder={
              '현재 오프라인으로 예약을 받고 있어 업무가 비효율적입니다.\n온라인 예약 및 결제 기능이 포함된 웹 서비스를 제작하고 싶습니다.\n초기에는 MVP 형태로 빠르게 출시 후 개선 예정입니다.'
            }
            value={form.inquiryDetails}
            onChange={handleTextChange('inquiryDetails')}
          />

          <Typography variant="h6">5. 첨부파일 (선택)</Typography>
          <TextField
            fullWidth
            type="file"
            slotProps={{ htmlInput: { multiple: true } }}
            onChange={handleFileChange}
            helperText="기획서, 와이어프레임, 디자인 시안 등"
          />
          {files.length ? (
            <Alert severity="info">
              선택된 파일: {files.map((file) => file.name).join(', ')}
            </Alert>
          ) : null}

          <Button type="submit" variant="contained" size="large" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? '문의 접수 중...' : '문의 접수하기'}
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
    </Container>
  )
}

export default App
