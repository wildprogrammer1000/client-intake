import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminPage from './AdminPage'
import HomePage from './pages/HomePage'
import FeatureExtensionInquiryPage from './pages/inquiry/FeatureExtensionInquiryPage'
import IssueResolutionInquiryPage from './pages/inquiry/IssueResolutionInquiryPage'
import NewServiceInquiryPage from './pages/inquiry/NewServiceInquiryPage'

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnNavigate />
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
