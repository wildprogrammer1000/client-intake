import ServiceInquiryForm from './ServiceInquiryForm'
import ServiceInquiryLayout from './ServiceInquiryLayout'

export default function IssueResolutionInquiryPage() {
  return (
    <ServiceInquiryLayout
      title="오류 해결 견적 문의"
      helperText="증상·재현 방법·환경을 알려 주시면 원인 파악과 대응 범위를 빠르게 안내해 드립니다. 로그나 캡처가 있으면 함께 보내 주세요."
    >
      <ServiceInquiryForm kind="issue-resolution" />
    </ServiceInquiryLayout>
  )
}
