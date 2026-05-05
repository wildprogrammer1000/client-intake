import ServiceInquiryForm from './ServiceInquiryForm'
import ServiceInquiryLayout from './ServiceInquiryLayout'

export default function FeatureExtensionInquiryPage() {
  return (
    <ServiceInquiryLayout
      title="기능 수정·확장 견적 문의"
      helperText="수정·확장이 필요한 기능에 대해 가능한 구체적으로 설명해주시면 정확한 견적 산정에 도움이 됩니다."
    >
      <ServiceInquiryForm kind="feature-extension" />
    </ServiceInquiryLayout>
  )
}
