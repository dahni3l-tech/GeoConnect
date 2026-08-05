import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from './pages/geoconnect-dashboard/Dashboard';
import SearchUsers from './pages/SearchUsers';
import Friends from './pages/Friends';
import FriendRequests from './pages/FriendRequests';
import Settings from './pages/Settings';
import FriendDetails from "./pages/FriendDetails";
import FriendMap from "./pages/FriendMap";
import Premium from "./pages/Premium/Premium";
import LocationRequest from "./pages/LocationRequest";
import ProfilePage from "./pages/ProfilePage";
import GuardianDashboard from "./pages/GuardianDashboard";
import GuardianPermissions from "./pages/GuardianPermissions";

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <FriendRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends/:id"
        element={
          <ProtectedRoute>
            <FriendDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends/:id/map"
        element={
          <ProtectedRoute>
            <FriendMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <Premium />
          </ProtectedRoute>
        }
      />
      <Route
        path="/location-request"
        element={
          <ProtectedRoute>
            <LocationRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guardian"
        element={
          <ProtectedRoute>
            <GuardianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guardian/permissions"
        element={
          <ProtectedRoute>
            <GuardianPermissions />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;