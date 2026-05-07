import { Stack, TextField, Typography } from '@mui/material'
import type { PhoneParts } from './phoneParts'
import { sanitizePhoneSegment } from './phoneParts'

const SEGMENT_MAX = [4, 4, 4] as const

type PhoneNumberFieldsProps = {
  value: PhoneParts
  onChange: (next: PhoneParts) => void
  required?: boolean
  disabled?: boolean
}

export default function PhoneNumberFields({
  value,
  onChange,
  required,
  disabled,
}: PhoneNumberFieldsProps) {
  const update = (key: keyof PhoneParts, raw: string, index: 0 | 1 | 2) => {
    const maxLen = SEGMENT_MAX[index]
    onChange({ ...value, [key]: sanitizePhoneSegment(raw, maxLen) })
  }

  return (
    <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        전화번호
        {required ? (
          <Typography component="span" sx={{ color: 'error.main', ml: 0.25 }}>
            *
          </Typography>
        ) : null}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
        <TextField
          disabled={disabled}
          placeholder="010"
          value={value.phone1}
          onChange={(event) => update('phone1', event.target.value, 0)}
          inputProps={{
            maxLength: SEGMENT_MAX[0],
            inputMode: 'numeric',
            autoComplete: 'tel-national',
            'aria-label': '전화번호 앞자리',
          }}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <Typography color="text.secondary" sx={{ flexShrink: 0 }}>
          -
        </Typography>
        <TextField
          disabled={disabled}
          placeholder="1234"
          value={value.phone2}
          onChange={(event) => update('phone2', event.target.value, 1)}
          inputProps={{
            maxLength: SEGMENT_MAX[1],
            inputMode: 'numeric',
            autoComplete: 'off',
            'aria-label': '전화번호 중간자리',
          }}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <Typography color="text.secondary" sx={{ flexShrink: 0 }}>
          -
        </Typography>
        <TextField
          disabled={disabled}
          placeholder="5678"
          value={value.phone3}
          onChange={(event) => update('phone3', event.target.value, 2)}
          inputProps={{
            maxLength: SEGMENT_MAX[2],
            inputMode: 'numeric',
            autoComplete: 'off',
            'aria-label': '전화번호 뒷자리',
          }}
          sx={{ flex: 1, minWidth: 0 }}
        />
      </Stack>
    </Stack>
  )
}
