import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { ToastContainer } from './components/Toast'
import InstallPrompt from './components/InstallPrompt'
import OfflineBanner from './components/OfflineBanner'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import ComparePage from './pages/ComparePage'
import ProviderDetailPage from './pages/ProviderDetailPage'
import HistoryPage from './pages/HistoryPage'
import AlertsPage from './pages/AlertsPage'
import SavedPlacesPage from './pages/SavedPlacesPage'
import ProfilePage from './pages/ProfilePage'
import PreferencesPage from './pages/PreferencesPage'
import MapRoutePage from './pages/MapRoutePage'
import AnalyticsPage from './pages/AnalyticsPage'
import CalculatorPage from './pages/CalculatorPage'
import AdminPage from './pages/AdminPage'
import ExplorePage from './pages/ExplorePage'
import FeatureDemoPage from './pages/FeatureDemoPage'
import SafetyPage from './pages/SafetyPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <OfflineBanner />
          <ToastContainer />
          <InstallPrompt />
          <Routes>
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/register"         element={<RegisterPage />} />
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/demo"             element={<FeatureDemoPage />} />
            <Route path="/"         element={<Navigate to="/home" replace />} />

            {/* Protected routes with bottom nav shell */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/home"      element={<HomePage />} />
              <Route path="/history"   element={<HistoryPage />} />
              <Route path="/alerts"    element={<AlertsPage />} />
              <Route path="/explore"   element={<ExplorePage />} />
              <Route path="/places"    element={<SavedPlacesPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin"     element={<AdminPage />} />
              <Route path="/safety"    element={<SafetyPage />} />
            </Route>

            {/* Protected full-screen routes (no bottom nav) */}
            <Route path="/map-route"       element={<ProtectedRoute><MapRoutePage /></ProtectedRoute>} />
            <Route path="/compare"         element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
            <Route path="/provider-detail" element={<ProtectedRoute><ProviderDetailPage /></ProtectedRoute>} />
            <Route path="/preferences"     element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
            <Route path="/calculator"      element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
