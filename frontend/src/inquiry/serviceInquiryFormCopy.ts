import type { InquiryServiceKind } from './inquiryPaths'

export type ServiceInquiryFormLabels = {
  name: string
  contact: string
  projectType: string
  projectTypeDetail: string
  developmentPurpose: string
  keyFeatures: string
  referenceLinks: string
  expectedTimeline: string
  budget: string
  inquiryDetails: string
}

export type ServiceInquiryFormPlaceholders = Partial<ServiceInquiryFormLabels>

export type ServiceInquiryFormCopy = {
  sectionBasic: string
  sectionProject: string
  sectionSchedule: string
  sectionDetail: string
  sectionFiles: string
  labels: ServiceInquiryFormLabels
  placeholders: ServiceInquiryFormPlaceholders
  fileHelper: string
}

export const SERVICE_INQUIRY_FORM_COPY: Record<InquiryServiceKind, ServiceInquiryFormCopy> = {
  'new-service': {
    sectionBasic: '기본 정보',
    sectionProject: '신청 정보',
    sectionSchedule: '일정과 예산',
    sectionDetail: '추가 정보',
    sectionFiles: '첨부 자료 (선택)',
    labels: {
      name: '이름',
      contact: '연락처',
      projectType: '유형',
      projectTypeDetail: '형태를 조금 더 구체적으로',
      developmentPurpose: '개발 목적',
      keyFeatures: '필요한 기능',
      referenceLinks: '참고 서비스·레퍼런스',
      expectedTimeline: '희망 일정',
      budget: '예산',
      inquiryDetails: '자유롭게 작성해 주세요',
    },
    placeholders: {
      name: '홍길동',
      contact: '010-1234-5678 또는 email@example.com',
      projectTypeDetail: '예: B2B 예약·정산 웹 서비스',
      developmentPurpose:
        '예: 창업 아이디어 MVP를 빠르게 출시하고 싶습니다.\n오프라인 예약을 온라인으로 옮기고 싶습니다.',
      keyFeatures:
        '예: 회원 가입·로그인\n예약·결제\n관리자에서 예약 확인\n(가능하면 우선순위도 적어 주세요)',
      referenceLinks: '닮고 싶은 UX, 레퍼런스 URL 등',
      expectedTimeline: '예: 2개월 안에 첫 버전 오픈 희망',
      budget: '예: 500만~1,000만 원대, 협의 가능',
      inquiryDetails: '',
    },
    fileHelper: '기획서, 와이어프레임, 디자인 시안 등',
  },
  'feature-extension': {
    sectionBasic: '기본 정보',
    sectionProject: '신청 정보',
    sectionSchedule: '일정과 예산',
    sectionDetail: '추가 정보',
    sectionFiles: '첨부 자료 (선택)',
    labels: {
      name: '이름',
      contact: '연락처',
      projectType: '기존 서비스 유형',
      projectTypeDetail: '형태를 조금 더 구체적으로',
      developmentPurpose: '수정 내용',
      keyFeatures: '세부 내용',
      referenceLinks: '서비스 URL·관련 문서',
      expectedTimeline: '희망 일정',
      budget: '예산',
      inquiryDetails: '테스트 계정, 주의할 점 등',
    },
    placeholders: {
      name: '홍길동',
      contact: '010-1234-5678 또는 email@example.com',
      projectTypeDetail: '예: 병원 예약 웹 + 간호사용 태블릿 앱',
      developmentPurpose:
        '예: 결제 수단을 추가하고 싶습니다.\n관리자 통계 화면을 새로 만들고 싶습니다.',
      keyFeatures:
        '예: 결제 페이지에 간편결제 추가\nOO 화면의 필드 추가',
      referenceLinks: 'https://… (운영 중인 주소), Notion·문서 링크 등',
      expectedTimeline: '예: 다음 분기 안, 이번 달 내 긴급 반영 희망',
      budget: '예: 300만 원 전후, 범위에 따라 협의',
      inquiryDetails:
        '절대 건드리면 안 되는 부분 등',
    },
    fileHelper: '화면 캡처, 변경 전·후 스케치, 짧은 동영상 등',
  },
  'issue-resolution': {
    sectionBasic: '기본 정보',
    sectionProject: '오류·장애 상황',
    sectionSchedule: '조치 일정과 예산',
    sectionDetail: '증상·재현·긴급도',
    sectionFiles: '로그·캡처 (선택)',
    labels: {
      name: '이름',
      contact: '연락처',
      projectType: '문제가 난 서비스 형태',
      projectTypeDetail: '형태를 조금 더 구체적으로',
      developmentPurpose: '언제부터·어떤 변화 후에 의심되나요?',
      keyFeatures: '재현 방법과 환경',
      referenceLinks: '문제가 나는 주소·앱 링크',
      expectedTimeline: '희망 일정',
      budget: '예산·긴급 대응 범위',
      inquiryDetails: '증상 상세, 기대 동작 vs 실제, 긴급도',
    },
    placeholders: {
      name: '홍길동',
      contact: '010-1234-5678 또는 email@example.com',
      projectTypeDetail: '예: iOS 앱 2.3.1, 특정 기업용 웹',
      developmentPurpose: '예: 지난주 배포 이후부터 / 특정 사용자만 발생',
      keyFeatures:
        '1) … 로그인\n2) … 메뉴 클릭\n3) 흰 화면·500 에러\n브라우저: Chrome 최신, OS: macOS …',
      referenceLinks: 'https://… (에러 나는 화면), Sentry·크래시 리포트 링크 등',
      expectedTimeline: '예: 영업일 기준 3일 내 원인 파악 희망',
      budget: '예: 긴급 대응 포함 200만 원까지, 협의',
      inquiryDetails:
        '에러 메시지 전문, 정상일 때는 어떻게 되어야 하는지, 서비스 중단 여부, 데이터 이슈 여부 등',
    },
    fileHelper: '스크린샷, 화면 녹화, 에러 로그·스택 트레이스를 첨부해 주시면 빠르게 파악할 수 있습니다.',
  },
}
