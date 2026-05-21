import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLayout from '../layouts/PageLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import Loader from '../components/common/Loader'
import ProtectedRoute from '../components/common/ProtectedRoute'
import RoleProtectedRoute from '../components/common/RoleProtectedRoute'

const HomePage = lazy(() => import('../pages/HomePage'))
const PropertiesPage = lazy(() => import('../pages/PropertiesPage'))
const PropertyDetailPage = lazy(() => import('../pages/PropertyDetailPage'))
const ComparePage = lazy(() => import('../pages/ComparePage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const SignupPage = lazy(() => import('../pages/auth/SignupPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const FAQPage = lazy(() => import('../pages/FAQPage'))
const FAQDetailPage = lazy(() => import('../pages/FAQDetailPage'))
const LocalityPage = lazy(() => import('../pages/LocalityPage'))
const BlogPage = lazy(() => import('../pages/BlogPage'))
const RecommendationPage = lazy(() => import('../pages/RecommendationPage'))
const LegalPage = lazy(() => import('../pages/LegalPage'))
const AdminDashboard = lazy(() => import('../pages/dashboard/admin/AdminDashboard'))
const VendorDashboard = lazy(() => import('../pages/dashboard/vendor/VendorDashboard'))
const UserDashboard = lazy(() => import('../pages/dashboard/user/UserDashboard'))
const UserProfilePage = lazy(() => import('../pages/dashboard/user/UserProfilePage'))
const AddPropertyPage = lazy(() => import('../pages/dashboard/vendor/AddPropertyPage'))
const ManagePropertiesPage = lazy(() => import('../pages/dashboard/vendor/ManagePropertiesPage'))
const VendorLeadsPage = lazy(() => import('../pages/dashboard/vendor/VendorLeadsPage'))
const ManageUsersPage = lazy(() => import('../pages/dashboard/admin/ManageUsersPage'))
const AdminVendorDetailPage = lazy(() => import('../pages/dashboard/admin/AdminVendorDetailPage'))
const AdminPropertyDetailPage = lazy(() => import('../pages/dashboard/admin/AdminPropertyDetailPage'))

function DashboardRedirect() {
  const { role } = useAuth()
  if (!role) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={`/dashboard/${role || 'user'}`} replace />
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
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/bangalore" element={<LocalityPage />} />
          <Route path="/bangalore/:localitySlug" element={<LocalityPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/faq/:category" element={<FAQPage />} />
          <Route path="/faq/:category/:faqSlug" element={<FAQDetailPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/blogs/:slug" element={<BlogPage />} />
          <Route path="/recommendations" element={<RecommendationPage />} />
          <Route path="/recommendations/:slug" element={<RecommendationPage />} />
          <Route path="/terms-and-conditions" element={<LegalPage />} />
          <Route path="/privacy-policy" element={<LegalPage />} />
          <Route path="/refund-policy" element={<LegalPage />} />
          <Route path="/vendor-policy" element={<LegalPage />} />
          <Route path="/community-guidelines" element={<LegalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="/vendor" element={<Navigate to="/dashboard/vendor" replace />} />

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
          path="admin/vendors/:vendorId"
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
          element={
            <RoleProtectedRoute role="vendor">
              <VendorDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="vendor/add-property"
          element={
            <RoleProtectedRoute role="vendor">
              <AddPropertyPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="vendor/leads"
          element={
            <RoleProtectedRoute role="vendor">
              <VendorLeadsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="vendor/properties"
          element={
            <RoleProtectedRoute role="vendor">
              <ManagePropertiesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="vendor/properties/:propertyId"
          element={
            <RoleProtectedRoute role="vendor">
              <PropertyDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="vendor/properties/:propertyId/edit"
          element={
            <RoleProtectedRoute role="vendor">
              <AddPropertyPage />
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
        <Route path="profile" element={<UserProfilePage />} />
      </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
