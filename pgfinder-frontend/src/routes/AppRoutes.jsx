import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLayout from '../layouts/PageLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import HomePage from '../pages/HomePage'
import PropertiesPage from '../pages/PropertiesPage'
import PropertyDetailPage from '../pages/PropertyDetailPage'
import ComparePage from '../pages/ComparePage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import NotFoundPage from '../pages/NotFoundPage'
import AdminDashboard from '../pages/dashboard/admin/AdminDashboard'
import VendorDashboard from '../pages/dashboard/vendor/VendorDashboard'
import UserDashboard from '../pages/dashboard/user/UserDashboard'
import UserProfilePage from '../pages/dashboard/user/UserProfilePage'
import AddPropertyPage from '../pages/dashboard/vendor/AddPropertyPage'
import ManagePropertiesPage from '../pages/dashboard/vendor/ManagePropertiesPage'
import VendorLeadsPage from '../pages/dashboard/vendor/VendorLeadsPage'
import ManageUsersPage from '../pages/dashboard/admin/ManageUsersPage'
import AdminVendorDetailPage from '../pages/dashboard/admin/AdminVendorDetailPage'
import AdminPropertyDetailPage from '../pages/dashboard/admin/AdminPropertyDetailPage'
import ProtectedRoute from '../components/common/ProtectedRoute'
import RoleProtectedRoute from '../components/common/RoleProtectedRoute'

function DashboardRedirect() {
  const { role } = useAuth()
  if (!role) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={`/dashboard/${role || 'user'}`} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PageLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

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
  )
}

export default AppRoutes
