import ServiceInquiryForm from './ServiceInquiryForm'
import ServiceInquiryLayout from './ServiceInquiryLayout'

export default function NewServiceInquiryPage() {
  return (
    <ServiceInquiryLayout
      title="신규 개발 견적 문의"
      helperText="개발이 필요한 서비스에 대해 가능한 구체적으로 설명해주시면 정확한 견적 산정에 도움이 됩니다."
    >
      <ServiceInquiryForm kind="new-service" />
    </ServiceInquiryLayout>
  )
}
