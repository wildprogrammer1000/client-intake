import { Button, Container, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

type ServiceInquiryLayoutProps = {
  title: string
  /** 페이지 상단 짧은 안내 */
  helperText?: string
  children?: ReactNode
}

export default function ServiceInquiryLayout({ title, helperText, children }: ServiceInquiryLayoutProps) {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 5 } }}>
      <Stack spacing={3}>
        <Button component={RouterLink} to="/" variant="text" sx={{ alignSelf: 'flex-start' }}>
          ← 홈으로
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {helperText ? (
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {helperText}
          </Typography>
        ) : null}
        {children}
      </Stack>
    </Container>
  )
}
