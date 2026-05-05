import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminPage from './AdminPage'
import HomePage from './pages/HomePage'
import FeatureExtensionInquiryPage from './pages/inquiry/FeatureExtensionInquiryPage'
import IssueResolutionInquiryPage from './pages/inquiry/IssueResolutionInquiryPage'
import NewServiceInquiryPage from './pages/inquiry/NewServiceInquiryPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/inquiry/new-service" element={<NewServiceInquiryPage />} />
        <Route path="/inquiry/feature-extension" element={<FeatureExtensionInquiryPage />} />
        <Route path="/inquiry/issue-resolution" element={<IssueResolutionInquiryPage />} />
        <Route path="/inquiry" element={<Navigate to="/" replace />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
