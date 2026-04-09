import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

type AdminMenuKey = 'inquiries' | 'settings'

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
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('inquiries')
  const [errorMessage, setErrorMessage] = useState('')
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordChanging, setIsPasswordChanging] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken(null)
    setAdminUser(null)
    setItems([])
    setSelected(null)
    setActiveMenu('inquiries')
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
    setIsDetailLoading(true)
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
    } finally {
      setIsDetailLoading(false)
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

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) {
      return
    }

    setPasswordChangeMessage('')
    setPasswordChangeError('')
    setIsPasswordChanging(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...withAuthHeader(token),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      if (response.status === 401) {
        logout()
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message ?? '비밀번호 변경에 실패했습니다.')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordChangeMessage('비밀번호가 성공적으로 변경되었습니다.')
    } catch (error) {
      setPasswordChangeError(
        error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.',
      )
    } finally {
      setIsPasswordChanging(false)
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
        <Card variant="outlined" sx={{ width: { xs: '100%', md: 260 }, height: 'fit-content' }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                메뉴
              </Typography>
              <Button
                fullWidth
                variant={activeMenu === 'inquiries' ? 'contained' : 'text'}
                onClick={() => setActiveMenu('inquiries')}
                sx={{ justifyContent: 'flex-start' }}
              >
                문의 목록
              </Button>
              <Button
                fullWidth
                variant={activeMenu === 'settings' ? 'contained' : 'text'}
                onClick={() => setActiveMenu('settings')}
                sx={{ justifyContent: 'flex-start' }}
              >
                설정
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ flex: 1 }}>
          {activeMenu === 'inquiries' ? (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    문의 목록
                  </Typography>
                  {isDetailLoading ? <Alert severity="info">문의 상세를 불러오는 중입니다.</Alert> : null}
                {items.map((item) => (
                  <Button
                    key={item.id}
                    variant="text"
                    color="inherit"
                    onClick={() => fetchDetail(item.id)}
                    sx={{
                      justifyContent: 'space-between',
                      textTransform: 'none',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 1.2,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.companyName ?? '회사명 미기재'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.contact}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        일정 {item.expectedTimeline}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        예산 {item.budget}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: 2, flexShrink: 0 }}>
                      <Chip size="small" label={item.projectType} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                      </Typography>
                    </Stack>
                  </Button>
                ))}
                {!items.length ? (
                  <Alert severity="info">등록된 문의가 없습니다.</Alert>
                ) : null}
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Stack component="form" spacing={1.5} onSubmit={handleChangePassword}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    관리자 비밀번호 변경
                  </Typography>
                  {passwordChangeError ? <Alert severity="error">{passwordChangeError}</Alert> : null}
                  {passwordChangeMessage ? <Alert severity="success">{passwordChangeMessage}</Alert> : null}
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField
                      label="현재 비밀번호"
                      type="password"
                      fullWidth
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                    <TextField
                      label="새 비밀번호"
                      type="password"
                      fullWidth
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      helperText="8자 이상 입력"
                    />
                    <TextField
                      label="새 비밀번호 확인"
                      type="password"
                      fullWidth
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </Stack>
                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={
                        isPasswordChanging ||
                        !currentPassword.trim() ||
                        !newPassword.trim() ||
                        !confirmPassword.trim()
                      }
                    >
                      {isPasswordChanging ? '변경 중...' : '비밀번호 변경'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Stack>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>문의 상세 {selected ? `#${selected.id}` : ''}</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Stack spacing={1.5}>
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
              <Divider />
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
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
