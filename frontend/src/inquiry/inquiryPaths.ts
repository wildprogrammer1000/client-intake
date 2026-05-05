/** 카드/문의 유형과 URL을 맞추기 위한 경로 (추후 API·DB inquiry 유형과 동일 키로 확장 가능) */
export const INQUIRY_PATH = {
  newService: '/inquiry/new-service',
  featureExtension: '/inquiry/feature-extension',
  issueResolution: '/inquiry/issue-resolution',
} as const

/** 라우트·폼에서 쓰는 문의 유형 키 */
export type InquiryServiceKind = 'new-service' | 'feature-extension' | 'issue-resolution'

export const INQUIRY_KIND_LABEL: Record<InquiryServiceKind, string> = {
  'new-service': '신규 서비스 개발',
  'feature-extension': '기능 수정·확장',
  'issue-resolution': '오류 해결',
}

export type InquiryServiceAccent = 'create' | 'extend' | 'fix'

export function inquiryPathForAccent(accent: InquiryServiceAccent): (typeof INQUIRY_PATH)[keyof typeof INQUIRY_PATH] {
  switch (accent) {
    case 'create':
      return INQUIRY_PATH.newService
    case 'extend':
      return INQUIRY_PATH.featureExtension
    case 'fix':
      return INQUIRY_PATH.issueResolution
  }
}
