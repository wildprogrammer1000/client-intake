import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'
const ADMIN_TOKEN_KEY = 'admin_access_token'

type AdminUser = {
  id: number
  email: string
  name: string
}

type InquiryListItem = {
  id: number
  companyName: string | null
  name: string
  contact: string
  projectType: string
  expectedTimeline: string
  budget: string
  createdAt: string
}

type InquiryDetail = InquiryListItem & {
  projectTypeDetail: string | null
  developmentPurpose: string
  keyFeatures: string
  referenceLinks: string | null
  inquiryDetails: string
  attachmentUrls: string[]
}

const withAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
})

export default function AdminPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('ChangeMe123!')
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(ADMIN_TOKEN_KEY),
  )
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [items, setItems] = useState<InquiryListItem[]>([])
  const [selected, setSelected] = useState<InquiryDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken(null)
    setAdminUser(null)
    setItems([])
    setSelected(null)
  }

  const fetchInquiries = async (accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/inquiries?page=1&pageSize=30`, {
      headers: withAuthHeader(accessToken),
    })
    if (response.status === 401) {
      logout()
      throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
    }
    if (!response.ok) {
      throw new Error('문의 목록 조회에 실패했습니다.')
    }

    const data = (await response.json()) as { items: InquiryListItem[] }
    setItems(data.items)
  }

  const fetchMe = async (accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/me`, {
      headers: withAuthHeader(accessToken),
    })
    if (response.status === 401) {
      logout()
      return
    }
    if (!response.ok) {
      throw new Error('관리자 인증 상태 확인에 실패했습니다.')
    }
    const data = (await response.json()) as { adminUser: AdminUser }
    setAdminUser(data.adminUser)
  }

  const fetchDetail = async (id: number) => {
    if (!token) {
      return
    }
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/inquiries/${id}`, {
        headers: withAuthHeader(token),
      })
      if (response.status === 401) {
        logout()
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }
      if (!response.ok) {
        throw new Error('문의 상세 조회에 실패했습니다.')
      }
      const data = (await response.json()) as InquiryDetail
      setSelected(data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '오류가 발생했습니다.')
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message ?? '로그인에 실패했습니다.')
      }

      const data = (await response.json()) as { token: string; adminUser: AdminUser }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      setToken(data.token)
      setAdminUser(data.adminUser)
      await fetchInquiries(data.token)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      return
    }
    ;(async () => {
      try {
        await fetchMe(token)
        await fetchInquiries(token)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.')
      }
    })()
  }, [token])

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card>
          <CardContent>
            <Stack component="form" spacing={2} onSubmit={handleLogin}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                관리자 로그인
              </Typography>
              {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
              <TextField
                label="이메일"
                fullWidth
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                label="비밀번호"
                type="password"
                fullWidth
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between' }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            관리자 문의 조회
          </Typography>
          <Typography color="text.secondary">
            {adminUser ? `${adminUser.name} (${adminUser.email})` : '관리자'}
          </Typography>
        </Stack>
        <Button variant="outlined" color="inherit" onClick={logout}>
          로그아웃
        </Button>
      </Stack>

      {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <Stack spacing={1} sx={{ width: { xs: '100%', md: '45%' } }}>
          {items.map((item) => (
            <Card key={item.id} variant="outlined">
              <CardContent>
                <Stack spacing={1.25}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Chip size="small" label={item.projectType} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {item.companyName ?? '회사명 미기재'} / {item.contact}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    일정: {item.expectedTimeline}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    예산: {item.budget}
                  </Typography>
                  <Button size="small" variant="text" onClick={() => fetchDetail(item.id)}>
                    상세보기
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {!items.length ? (
            <Alert severity="info">등록된 문의가 없습니다.</Alert>
          ) : null}
        </Stack>

        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            {selected ? (
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  문의 상세 #{selected.id}
                </Typography>
                <Divider />
                <Typography><strong>이름:</strong> {selected.name}</Typography>
                <Typography><strong>연락처:</strong> {selected.contact}</Typography>
                <Typography><strong>회사명:</strong> {selected.companyName ?? '-'}</Typography>
                <Typography><strong>유형:</strong> {selected.projectType}</Typography>
                <Typography><strong>유형 상세:</strong> {selected.projectTypeDetail ?? '-'}</Typography>
                <Typography><strong>개발 목적:</strong> {selected.developmentPurpose}</Typography>
                <Typography><strong>주요 기능:</strong> {selected.keyFeatures}</Typography>
                <Typography><strong>레퍼런스:</strong> {selected.referenceLinks ?? '-'}</Typography>
                <Typography><strong>일정:</strong> {selected.expectedTimeline}</Typography>
                <Typography><strong>예산:</strong> {selected.budget}</Typography>
                <Typography><strong>문의 내용:</strong> {selected.inquiryDetails}</Typography>
                <Box>
                  <Typography sx={{ mb: 0.5 }}><strong>첨부파일</strong></Typography>
                  {selected.attachmentUrls.length ? (
                    <Stack spacing={0.5}>
                      {selected.attachmentUrls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          {url}
                        </a>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">첨부파일 없음</Typography>
                  )}
                </Box>
              </Stack>
            ) : (
              <Alert severity="info">왼쪽 목록에서 문의를 선택하면 상세가 표시됩니다.</Alert>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}
