import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLayout from '../layouts/PageLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import Loader from '../components/common/Loader'
import ProtectedRoute from '../components/common/ProtectedRoute'
import RoleProtectedRoute from '../components/common/RoleProtectedRoute'
import HomePage from '../pages/HomePage'

const PropertiesPage = lazy(() => import('../pages/PropertiesPage'))
const PropertyDetailPage = lazy(() => import('../pages/PropertyDetailPage'))
const ComparePage = lazy(() => import('../pages/ComparePage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const SignupPage = lazy(() => import('../pages/auth/SignupPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const FAQPage = lazy(() => import('../pages/FAQPage'))
const FAQDetailPage = lazy(() => import('../pages/FAQDetailPage'))
const LocalityPage = lazy(() => import('../pages/LocalityPage'))
const LegalPage = lazy(() => import('../pages/LegalPage'))
const SeoArticlePage = lazy(() => import('../pages/SeoArticlePage'))
const AdminDashboard = lazy(() => import('../pages/dashboard/admin/AdminDashboard'))
const VendorDashboard = lazy(() => import('../pages/dashboard/vendor/VendorDashboard'))
const UserDashboard = lazy(() => import('../pages/dashboard/user/UserDashboard'))
const UserProfilePage = lazy(() => import('../pages/dashboard/user/UserProfilePage'))
const AddPropertyPage = lazy(() => import('../pages/dashboard/vendor/AddPropertyPage'))
const ManagePropertiesPage = lazy(() => import('../pages/dashboard/vendor/ManagePropertiesPage'))
const VendorLeadsPage = lazy(() => import('../pages/dashboard/vendor/VendorLeadsPage'))
const ManageUsersPage = lazy(() => import('../pages/dashboard/admin/ManageUsersPage'))
const AdminAdsPage = lazy(() => import('../pages/dashboard/admin/AdminAdsPage'))
const AdminVendorDetailPage = lazy(() => import('../pages/dashboard/admin/AdminVendorDetailPage'))
const AdminPropertyDetailPage = lazy(() => import('../pages/dashboard/admin/AdminPropertyDetailPage'))
const MessagesPage = lazy(() => import('../pages/dashboard/MessagesPage'))
const NotificationsPage = lazy(() => import('../pages/dashboard/NotificationsPage'))

function DashboardRedirect() {
  const { role } = useAuth()
  if (!role) {
    return <Navigate to="/login" replace />
  }
  const dashboardRole = role === 'owner' ? 'owner' : role || 'user'
  return <Navigate to={`/dashboard/${dashboardRole}`} replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-6 text-white"><Loader message="Loading StayJi..." /></div>}>
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
          <Route path="/bangalore" element={<LocalityPage />} />
          <Route path="/bangalore/:localitySlug" element={<LocalityPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/faq/:category" element={<FAQPage />} />
          <Route path="/faq/:category/:faqSlug" element={<FAQDetailPage />} />
          <Route path="/blog" element={<Navigate to="/blogs/bangalore-rental-guide" replace />} />
          <Route path="/blog/:slug" element={<SeoArticlePage />} />
          <Route path="/blogs" element={<Navigate to="/blogs/bangalore-rental-guide" replace />} />
          <Route path="/blogs/:slug" element={<SeoArticlePage />} />
          <Route path="/recommendations" element={<Navigate to="/properties" replace />} />
          <Route path="/recommendations/:slug" element={<SeoArticlePage type="recommendation" />} />
          <Route path="/terms-and-conditions" element={<LegalPage />} />
          <Route path="/privacy-policy" element={<LegalPage />} />
          <Route path="/refund-policy" element={<LegalPage />} />
          <Route path="/vendor-policy" element={<LegalPage />} />
          <Route path="/community-guidelines" element={<LegalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-login" element={<LoginPage portal="admin" />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="/vendor" element={<Navigate to="/dashboard/owner" replace />} />
      <Route path="/owner" element={<Navigate to="/dashboard/owner" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRedirect />} />
        <Route
          path="admin"
          element={
            <RoleProtectedRoute role="admin">
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleProtectedRoute role="admin">
              <ManageUsersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/ads"
          element={
            <RoleProtectedRoute role="admin">
              <AdminAdsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/vendors/:vendorId"
          element={
            <RoleProtectedRoute role="admin">
              <AdminVendorDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/owners/:ownerId"
          element={
            <RoleProtectedRoute role="admin">
              <AdminVendorDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/properties/:propertyId"
          element={
            <RoleProtectedRoute role="admin">
              <AdminPropertyDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/properties/:propertyId/edit"
          element={
            <RoleProtectedRoute role="admin">
              <AddPropertyPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="vendor"
          element={<Navigate to="/dashboard/owner" replace />}
        />
        <Route
          path="owner"
          element={
            <RoleProtectedRoute role="owner">
              <VendorDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route path="vendor/*" element={<Navigate to="/dashboard/owner" replace />} />
        <Route
          path="owner/add-property"
          element={
            <RoleProtectedRoute role="owner">
              <AddPropertyPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="owner/leads"
          element={
            <RoleProtectedRoute role="owner">
              <VendorLeadsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="owner/properties"
          element={
            <RoleProtectedRoute role="owner">
              <ManagePropertiesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="owner/properties/:propertyId"
          element={
            <RoleProtectedRoute role="owner">
              <PropertyDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="owner/properties/:propertyId/edit"
          element={
            <RoleProtectedRoute role="owner">
              <AddPropertyPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="owner/messages"
          element={
            <RoleProtectedRoute role="owner">
              <MessagesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="user"
          element={
            <RoleProtectedRoute role="user">
              <UserDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="user/messages"
          element={
            <RoleProtectedRoute role="user">
              <MessagesPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="user/notifications" element={<RoleProtectedRoute role="user"><NotificationsPage /></RoleProtectedRoute>} />
        <Route path="owner/notifications" element={<RoleProtectedRoute role="owner"><NotificationsPage /></RoleProtectedRoute>} />
        <Route path="admin/notifications" element={<RoleProtectedRoute role="admin"><NotificationsPage /></RoleProtectedRoute>} />
        <Route path="profile" element={<UserProfilePage />} />
      </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
