export type PhoneParts = {
  phone1: string
  phone2: string
  phone3: string
}

export const emptyPhoneParts = (): PhoneParts => ({
  phone1: '',
  phone2: '',
  phone3: '',
})

export function sanitizePhoneSegment(raw: string, maxLen: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLen)
}

/** 제출 시 API·DB 저장용 (예: `010-1234-5678`) */
export function joinPhoneParts(parts: PhoneParts): string {
  return [parts.phone1, parts.phone2, parts.phone3].map((s) => s.trim()).join('-')
}

export function isPhonePartsComplete(parts: PhoneParts): boolean {
  return [parts.phone1, parts.phone2, parts.phone3].every((s) => s.trim().length > 0)
}
