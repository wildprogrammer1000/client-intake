import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'
const ADMIN_TOKEN_KEY = 'admin_access_token'

type AdminUser = {
  id: number
  userId: string
  name: string
}

type InquiryListItem = {
  id: number
  companyName: string | null
  name: string
  contact: string
  projectType: string
  status: InquiryStatus
  adminMemo: string | null
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
type InquiryStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'

const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  WAITING: '대기',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
}

const INQUIRY_STATUS_COLORS: Record<InquiryStatus, 'default' | 'warning' | 'info' | 'success'> = {
  WAITING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
}

const withAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
})

export default function AdminPage() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
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
  const [isManagementSaving, setIsManagementSaving] = useState(false)
  const [statusSavingIds, setStatusSavingIds] = useState<Record<number, boolean>>({})
  const [managementStatus, setManagementStatus] = useState<InquiryStatus>('WAITING')
  const [managementMemo, setManagementMemo] = useState('')

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
      setManagementStatus(data.status)
      setManagementMemo(data.adminMemo ?? '')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '오류가 발생했습니다.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleSaveInquiryManagement = async () => {
    if (!token || !selected) {
      return
    }

    setErrorMessage('')
    setIsManagementSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/inquiries/${selected.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...withAuthHeader(token),
        },
        body: JSON.stringify({
          status: managementStatus,
          adminMemo: managementMemo.trim() || null,
        }),
      })

      if (response.status === 401) {
        logout()
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message ?? '문의 관리 정보 저장에 실패했습니다.')
      }

      const updated = (await response.json()) as InquiryDetail
      setSelected(updated)
      setManagementStatus(updated.status)
      setManagementMemo(updated.adminMemo ?? '')
      setItems((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                status: updated.status,
                adminMemo: updated.adminMemo,
              }
            : item,
        ),
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '문의 관리 정보 저장 중 오류가 발생했습니다.')
    } finally {
      setIsManagementSaving(false)
    }
  }

  const handleChangeInquiryStatus = async (id: number, status: InquiryStatus) => {
    if (!token) {
      return
    }

    setErrorMessage('')
    setStatusSavingIds((prev) => ({ ...prev, [id]: true }))
    const previousItem = items.find((item) => item.id === id)

    // Optimistic update for immediate feedback in the grid.
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...withAuthHeader(token),
        },
        body: JSON.stringify({ status }),
      })

      if (response.status === 401) {
        logout()
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message ?? '문의 상태 변경에 실패했습니다.')
      }

      const updated = (await response.json()) as InquiryDetail
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: updated.status,
                adminMemo: updated.adminMemo,
              }
            : item,
        ),
      )
      if (selected?.id === id) {
        setSelected(updated)
        setManagementStatus(updated.status)
        setManagementMemo(updated.adminMemo ?? '')
      }
    } catch (error) {
      if (previousItem) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: previousItem.status } : item)),
        )
      }
      setErrorMessage(error instanceof Error ? error.message : '문의 상태 변경 중 오류가 발생했습니다.')
    } finally {
      setStatusSavingIds((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
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
        body: JSON.stringify({ userId, password }),
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

  const inquiryColumns: GridColDef<InquiryListItem>[] = [
    { field: 'name', headerName: '이름', minWidth: 120, flex: 0.9 },
    {
      field: 'companyName',
      headerName: '회사명',
      minWidth: 140,
      flex: 1.1,
      valueGetter: (_value, row) => row.companyName ?? '회사명 미기재',
    },
    { field: 'contact', headerName: '연락처', minWidth: 170, flex: 1.1 },
    {
      field: 'status',
      headerName: '상태',
      minWidth: 170,
      flex: 1,
      renderCell: (params: GridRenderCellParams<InquiryListItem, InquiryStatus>) => (
        <FormControl
          size="small"
          fullWidth
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Select
            value={params.value ?? 'WAITING'}
            disabled={Boolean(statusSavingIds[params.row.id])}
            onChange={(event) =>
              handleChangeInquiryStatus(params.row.id, event.target.value as InquiryStatus)
            }
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="WAITING">
              <Chip
                size="small"
                label={INQUIRY_STATUS_LABELS.WAITING}
                color={INQUIRY_STATUS_COLORS.WAITING}
              />
            </MenuItem>
            <MenuItem value="IN_PROGRESS">
              <Chip
                size="small"
                label={INQUIRY_STATUS_LABELS.IN_PROGRESS}
                color={INQUIRY_STATUS_COLORS.IN_PROGRESS}
              />
            </MenuItem>
            <MenuItem value="COMPLETED">
              <Chip
                size="small"
                label={INQUIRY_STATUS_LABELS.COMPLETED}
                color={INQUIRY_STATUS_COLORS.COMPLETED}
              />
            </MenuItem>
          </Select>
        </FormControl>
      ),
    },
    {
      field: 'projectType',
      headerName: '유형',
      minWidth: 130,
      flex: 0.9,
      renderCell: (params: GridRenderCellParams<InquiryListItem, string>) => (
        <Chip
          size="small"
          label={params.value ?? '-'}
          title={params.value ?? '-'}
          sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
        />
      ),
    },
    {
      field: 'adminMemo',
      headerName: '메모',
      minWidth: 180,
      flex: 1.2,
      valueGetter: (value) => value ?? '-',
    },
    { field: 'expectedTimeline', headerName: '일정', minWidth: 130, flex: 1 },
    { field: 'budget', headerName: '예산', minWidth: 130, flex: 1 },
    {
      field: 'createdAt',
      headerName: '접수일',
      minWidth: 120,
      flex: 0.8,
      valueGetter: (value) => new Date(value as string).toLocaleDateString('ko-KR'),
    },
    {
      field: 'actions',
      headerName: '상세',
      sortable: false,
      filterable: false,
      minWidth: 100,
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<InquiryListItem>) => (
        <Button size="small" variant="outlined" onClick={() => fetchDetail(params.row.id)}>
          보기
        </Button>
      ),
    },
  ]

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
                label="아이디"
                fullWidth
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
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
        direction="row"
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between' }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            관리자페이지
          </Typography>
          <Typography color="text.secondary">
            {adminUser ? `${adminUser.name} (${adminUser.userId})` : '관리자'}
          </Typography>
        </Stack>
        <Button variant="outlined" color="inherit" onClick={logout}>
          로그아웃
        </Button>
      </Stack>

      {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <Card
          variant="outlined"
          sx={{
            width: { xs: '100%', md: 260 },
            minWidth: { xs: '100%', md: 220 },
            flexShrink: 0,
            height: 'fit-content',
          }}
        >
          <CardContent>
            <Stack direction={{ xs: 'row', md: 'column' }} spacing={1}>
              <Button
                variant={activeMenu === 'inquiries' ? 'contained' : 'text'}
                onClick={() => setActiveMenu('inquiries')}
                sx={{
                  flex: { xs: 1, md: 'none' },
                  width: { xs: 'auto', md: '100%' },
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                문의 목록
              </Button>
              <Button
                variant={activeMenu === 'settings' ? 'contained' : 'text'}
                onClick={() => setActiveMenu('settings')}
                sx={{
                  flex: { xs: 1, md: 'none' },
                  width: { xs: 'auto', md: '100%' },
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                설정
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: { xs: '100%', md: 'auto' },
          }}
        >
          {activeMenu === 'inquiries' ? (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    문의 목록
                  </Typography>
                  {isDetailLoading ? <Alert severity="info">문의 상세를 불러오는 중입니다.</Alert> : null}
                  {items.length ? (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <DataGrid
                          rows={items}
                          columns={inquiryColumns}
                          getRowId={(row) => row.id}
                          disableRowSelectionOnClick
                          initialState={{
                            pagination: { paginationModel: { page: 0, pageSize: 10 } },
                          }}
                          pageSizeOptions={[10, 30, 50]}
                          getRowClassName={(params) =>
                            selected?.id === params.row.id ? 'selected-inquiry-row' : ''
                          }
                          sx={{
                            '& .MuiDataGrid-cell': {
                              display: 'flex',
                              alignItems: 'center',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                            },
                            '& .MuiDataGrid-columnHeaderTitle': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 700,
                            },
                            '& .selected-inquiry-row': {
                              bgcolor: 'action.selected',
                            },
                          }}
                        />
                    </Box>
                  ) : (
                    <Alert severity="info">등록된 문의가 없습니다.</Alert>
                  )}
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
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel id="inquiry-status-label">상태</InputLabel>
                  <Select
                    labelId="inquiry-status-label"
                    label="상태"
                    value={managementStatus}
                    onChange={(event) => setManagementStatus(event.target.value as InquiryStatus)}
                  >
                    <MenuItem value="WAITING">대기</MenuItem>
                    <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                    <MenuItem value="COMPLETED">완료</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleSaveInquiryManagement}
                  disabled={isManagementSaving}
                  sx={{ minWidth: 120 }}
                >
                  {isManagementSaving ? <CircularProgress size={18} color="inherit" /> : '관리 정보 저장'}
                </Button>
              </Stack>
              <TextField
                label="관리자 메모"
                multiline
                minRows={3}
                fullWidth
                value={managementMemo}
                onChange={(event) => setManagementMemo(event.target.value)}
                helperText="내부 관리용 메모입니다."
              />
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
