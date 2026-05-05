import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import { INQUIRY_PATH, type InquiryServiceAccent } from '../inquiry/inquiryPaths'

const SERVICE_CARDS: readonly {
  title: string
  subtitle: string
  accent: InquiryServiceAccent
  path: (typeof INQUIRY_PATH)[keyof typeof INQUIRY_PATH]
}[] = [
  {
    title: '신규 개발',
    subtitle: '웹사이트, 게임, 앱, 서비스 프로그램 등',
    accent: 'create',
    path: INQUIRY_PATH.newService,
  },
  {
    title: '기능 수정/확장',
    subtitle: '기존 서비스의 기능 수정/확장',
    accent: 'extend',
    path: INQUIRY_PATH.featureExtension,
  },
  {
    title: '오류 해결',
    subtitle: '서비스의 오류 증상 분석/해결',
    accent: 'fix',
    path: INQUIRY_PATH.issueResolution,
  },
]

function accentColor(theme: Theme, accent: InquiryServiceAccent) {
  switch (accent) {
    case 'create':
      return theme.palette.info.main
    case 'extend':
      return theme.palette.secondary.main
    case 'fix':
      return theme.palette.error.main
  }
}

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
        py: 3,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 3, md: 4.5 }} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Stack spacing={{ xs: 1, md: 1.25 }} sx={{ alignItems: 'center', maxWidth: 720 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                maxWidth: 720,
                lineHeight: 1.45,
                whiteSpace: 'pre-line',
                fontSize: { md: '2.5rem', lg: '2.75rem' },
              }}
            >
              {`안녕하세요,
어떤 서비스가 필요하세요?`}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.5,
                fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.0625rem' },
              }}
            >
              아래 카드를 클릭하여 무료로 견적을 받아보세요!
            </Typography>
          </Stack>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 2, md: 2.5 }}
            useFlexGap
            sx={{
              width: '100%',
              maxWidth: { xs: 400, md: 'none' },
              alignItems: { xs: 'center', md: 'stretch' },
            }}
          >
            {SERVICE_CARDS.map(({ title, subtitle, accent, path }) => (
              <Card
                key={path}
                variant="outlined"
                sx={(theme) => {
                  const tone = accentColor(theme, accent)
                  return {
                    flex: { md: 1 },
                    alignSelf: { xs: 'stretch', md: 'auto' },
                    width: { xs: '100%', md: 'auto' },
                    maxWidth: { xs: 400, md: 'none' },
                    mx: { xs: 'auto', md: 0 },
                    aspectRatio: { xs: '4/3', md: '3/2' },
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: alpha(tone, 0.07),
                    borderColor: alpha(tone, 0.32),
                    transition: theme.transitions.create(
                      ['transform', 'box-shadow', 'border-color', 'background-color'],
                      {
                        duration: theme.transitions.duration.short,
                        easing: theme.transitions.easing.easeOut,
                      },
                    ),
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      bgcolor: alpha(tone, 0.11),
                      boxShadow: `0 10px 28px ${alpha(tone, 0.14)}, ${theme.shadows[6]}`,
                      borderColor: alpha(tone, 0.55),
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                      transition: 'none',
                      '&:hover': {
                        transform: 'none',
                      },
                    },
                  }
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={path}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'stretch',
                    alignSelf: 'stretch',
                    color: 'inherit',
                  }}
                >
                  <CardContent
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      width: '100%',
                      p: { xs: 2.5, md: 3.5 },
                      '&:last-child': { pb: { xs: 2.5, md: 3.5 } },
                    }}
                  >
                    <Stack spacing={{ xs: 1.25, md: 1.5 }} sx={{ maxWidth: '100%' }}>
                      <Typography
                        component="h2"
                        sx={{
                          fontWeight: 700,
                          fontSize: {
                            xs: '1.75rem',
                            sm: '1.875rem',
                            md: '1.75rem',
                            lg: '1.875rem',
                          },
                          lineHeight: 1.35,
                        }}
                      >
                        {title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.5,
                          whiteSpace: 'normal',
                          fontSize: {
                            xs: '1.125rem',
                            sm: '1.1875rem',
                            md: '0.9375rem',
                          },
                        }}
                      >
                        {subtitle}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
